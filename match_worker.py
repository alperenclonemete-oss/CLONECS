"""Run one worker process: python match_worker.py. Web requests never parse demos."""
import bz2
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import urlsplit
import httpx
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env.worker")
load_dotenv()
from account_store import connection, db_cursor, init_database
from match_tracking import cipher, sql, init_tracking, enqueue, SHARE

ROOT = Path(__file__).resolve().parent
MAX_BYTES = 512 * 1024 * 1024


def resolve_demo(code):
    result = subprocess.run([os.getenv("NODE_BINARY", "node"), str(ROOT / "worker" / "resolve-demo.cjs"), code],
                            capture_output=True, text=True, timeout=100)
    if result.returncode:
        raise ValueError("Steam demo bağlantısı alınamadı; işleyici hesabını veya demo süresini kontrol edin.")
    return json.loads(result.stdout)["url"]


def validate_demo_url(url):
    parsed = urlsplit(url)
    host = parsed.hostname or ""
    if (parsed.scheme not in ("https", "http") or parsed.username or parsed.password or parsed.port not in (None, 80, 443)
            or not re.fullmatch(r"replay[\w-]*\.valve\.net", host)
            or not parsed.path.endswith(".dem.bz2")):
        raise ValueError("Valve demo adresi doğrulanamadı.")
    return url


def download_demo(url, target):
    validate_demo_url(url)
    decoder = bz2.BZ2Decompressor()
    compressed = expanded = 0
    deadline = time.monotonic() + 180
    with httpx.stream("GET", url, timeout=30, follow_redirects=False) as response, open(target, "wb") as out:
        response.raise_for_status()
        for chunk in response.iter_bytes(128 * 1024):
            if time.monotonic() > deadline:
                raise ValueError("Demo indirme süresi aşıldı.")
            compressed += len(chunk)
            if compressed > MAX_BYTES:
                raise ValueError("Demo dosya sınırını aşıyor.")
            data = decoder.decompress(chunk, max_length=MAX_BYTES - expanded + 1)
            expanded += len(data)
            if expanded > MAX_BYTES:
                raise ValueError("Açılmış demo dosya sınırını aşıyor.")
            out.write(data)
        if not decoder.eof:
            raise ValueError("Demo indirmesi eksik.")
    with open(target, "rb") as demo:
        if demo.read(8) != b"PBDEMS2\x00":
            raise ValueError("Geçerli CS2 demosu değil.")


def poll_tracking():
    with connection() as conn, db_cursor(conn) as cur:
        cur.execute(sql("SELECT * FROM cs2_tracking WHERE checked_at < ? ORDER BY checked_at LIMIT 20"), (int(time.time()) - 300,))
        accounts = [dict(r) for r in cur.fetchall()]
    for account in accounts:
        status, error = "active", ""
        cursor = account["cursor_code"]
        try:
            auth = cipher().decrypt(account["auth_cipher"].encode()).decode()
            for _ in range(10):
                response = httpx.get("https://api.steampowered.com/ICSGOPlayers_730/GetNextMatchSharingCode/v1/",
                    params={"key": os.environ["STEAM_API_KEY"], "steamid": account["steam_id"], "steamidkey": auth, "knowncode": cursor}, timeout=25)
                if response.status_code == 202:
                    break
                response.raise_for_status()
                code = response.json().get("result", {}).get("nextcode")
                if code == "n/a":
                    break
                if not isinstance(code, str) or not SHARE.fullmatch(code) or code == cursor:
                    raise ValueError("Unexpected match history response")
                with connection() as conn, db_cursor(conn) as cur:
                    # A disconnected or reconfigured account must not be resurrected.
                    cur.execute(sql("SELECT cursor_code FROM cs2_tracking WHERE user_id=? AND auth_cipher=?"), (account["user_id"], account["auth_cipher"]))
                    current = cur.fetchone()
                    if not current or current["cursor_code"] != cursor:
                        break
                    enqueue(cur, account["user_id"], account["steam_id"], code)
                    cur.execute(sql("UPDATE cs2_tracking SET cursor_code=? WHERE user_id=?"), (code, account["user_id"]))
                cursor = code
        except Exception:
            status, error = "error", "Steam maç geçmişi alınamadı. Erişim kodunu, başlangıç maçını ve sunucu ayarlarını kontrol edin."
        with connection() as conn, db_cursor(conn) as cur:
            cur.execute(sql("UPDATE cs2_tracking SET status=?,error=?,checked_at=? WHERE user_id=? AND auth_cipher=?"),
                        (status, error, int(time.time()), account["user_id"], account["auth_cipher"]))


def process_one():
    now = int(time.time())
    with connection() as conn, db_cursor(conn) as cur:
        cur.execute(sql("UPDATE cs2_matches SET status='failed',error='İşleme kesildi; yeniden bağlantı gerekebilir.' WHERE status='processing' AND attempts>=5 AND retry_at<=?"), (now,))
        cur.execute(sql("""SELECT m.* FROM cs2_matches m JOIN cs2_tracking t ON m.user_id=t.user_id AND m.steam_id=t.steam_id
            WHERE m.status IN ('queued','retry','processing') AND m.retry_at <= ? AND m.attempts < 5
            ORDER BY m.created_at LIMIT 1"""), (now,))
        row = cur.fetchone()
        if not row:
            return False
        job = dict(row)
        cur.execute(sql("""UPDATE cs2_matches SET status='processing',attempts=attempts+1,retry_at=?
            WHERE user_id=? AND share_code=? AND retry_at<=? AND attempts=?"""),
            (now + 900, job["user_id"], job["share_code"], now, job["attempts"]))
        if cur.rowcount != 1:
            return False
    try:
        url = resolve_demo(job["share_code"])
        with tempfile.TemporaryDirectory(prefix="clone-demo-") as directory:
            path = Path(directory) / "match.dem"
            download_demo(url, path)
            result = subprocess.run([sys.executable, "-X", "utf8", str(ROOT / "match_analysis.py"), str(path), job["steam_id"]],
                                    capture_output=True, text=True, encoding="utf-8", timeout=180)
            if result.returncode:
                raise ValueError("Demo analysis failed")
            payload = json.loads(result.stdout)
            if payload.get("steam_id") != job["steam_id"] or "error" in payload:
                raise ValueError("Player mismatch")
        state, error, serialized = "complete", "", json.dumps(payload, ensure_ascii=False)
    except Exception:
        state = "failed" if job["attempts"] >= 4 else "retry"
        error, serialized = "Demo alınamadı veya çözümlenemedi. Süresi dolmuş ya da oyuncuyu içermeyen bir demo olabilir.", None
    with connection() as conn, db_cursor(conn) as cur:
        cur.execute(sql("UPDATE cs2_matches SET status=?,error=?,result_json=?,retry_at=? WHERE user_id=? AND share_code=?"),
                    (state, error, serialized, int(time.time()) + 900, job["user_id"], job["share_code"]))
    return True


if __name__ == "__main__":
    cipher()
    if not os.getenv("STEAM_API_KEY") or not os.getenv("STEAM_WORKER_REFRESH_TOKEN"):
        sys.exit("STEAM_API_KEY ve STEAM_WORKER_REFRESH_TOKEN ayarlanmalı.")
    init_database()
    init_tracking()
    while True:
        try:
            poll_tracking()
            busy = process_one()
        except Exception:
            print("Maç işleyicisi geçici hata aldı; tekrar denenecek.", flush=True)
            busy = False
        time.sleep(2 if busy else 30)
