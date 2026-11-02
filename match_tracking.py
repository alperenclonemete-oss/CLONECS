"""Account-scoped match subscriptions and durable analysis queue."""
import json
import os
import re
import time
from account_store import connection, db_cursor, DATABASE_URL

SHARE = re.compile(r"CSGO(?:-[A-Za-z0-9]{5}){5}\Z")
AUTH = re.compile(r"[A-Za-z0-9]{4}-[A-Za-z0-9]{5}-[A-Za-z0-9]{4}\Z")


def cipher():
    from cryptography.fernet import Fernet
    key = os.getenv("MATCH_TRACKING_KEY", "")
    if not key:
        raise ValueError("Maç takibi sunucu kurulumu henüz tamamlanmadı.")
    return Fernet(key.encode())


def sql(query):
    return query.replace("?", "%s") if DATABASE_URL else query


def init_tracking():
    with connection() as conn, db_cursor(conn) as cur:
        cur.execute("""CREATE TABLE IF NOT EXISTS cs2_tracking (
            user_id TEXT PRIMARY KEY REFERENCES coach_users(user_id) ON DELETE CASCADE,
            steam_id TEXT NOT NULL, auth_cipher TEXT NOT NULL, cursor_code TEXT NOT NULL,
            status TEXT NOT NULL, checked_at BIGINT NOT NULL DEFAULT 0, error TEXT NOT NULL DEFAULT '')""")
        cur.execute("""CREATE TABLE IF NOT EXISTS cs2_matches (
            user_id TEXT NOT NULL REFERENCES coach_users(user_id) ON DELETE CASCADE,
            share_code TEXT NOT NULL, steam_id TEXT NOT NULL, status TEXT NOT NULL,
            result_json TEXT, error TEXT NOT NULL DEFAULT '', created_at BIGINT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0, retry_at BIGINT NOT NULL DEFAULT 0,
            PRIMARY KEY(user_id, share_code))""")


def connect_tracking(user_id, steam_id, auth, code):
    if not AUTH.fullmatch(auth) or not SHARE.fullmatch(code):
        raise ValueError("Steam erişim kodu veya maç paylaşım kodu biçimi geçersiz.")
    encrypted = cipher().encrypt(auth.encode()).decode()
    with connection() as conn, db_cursor(conn) as cur:
        cur.execute(sql("""INSERT INTO cs2_tracking(user_id,steam_id,auth_cipher,cursor_code,status)
            VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET steam_id=excluded.steam_id,
            auth_cipher=excluded.auth_cipher,cursor_code=excluded.cursor_code,status=excluded.status,checked_at=0,error=''"""),
            (user_id, steam_id, encrypted, code, "pending"))
        enqueue(cur, user_id, steam_id, code)


def enqueue(cur, user_id, steam_id, code):
    cur.execute(sql("""INSERT INTO cs2_matches(user_id,share_code,steam_id,status,created_at)
        VALUES(?,?,?,?,?) ON CONFLICT(user_id,share_code) DO NOTHING"""),
        (user_id, code, steam_id, "queued", int(time.time())))


def disconnect_tracking(user_id):
    with connection() as conn, db_cursor(conn) as cur:
        cur.execute(sql("DELETE FROM cs2_tracking WHERE user_id=?"), (user_id,))
        cur.execute(sql("DELETE FROM cs2_matches WHERE user_id=? AND status != 'complete'"), (user_id,))


def tracking_status(user_id, steam_id):
    with connection() as conn, db_cursor(conn) as cur:
        cur.execute(sql("SELECT status,checked_at,error FROM cs2_tracking WHERE user_id=? AND steam_id=?"), (user_id, steam_id))
        row = cur.fetchone()
        tracking = dict(row) if row else None
        cur.execute(sql("SELECT status,result_json,error,created_at FROM cs2_matches WHERE user_id=? AND steam_id=? ORDER BY created_at DESC LIMIT 30"), (user_id, steam_id))
        matches = [{"status": r["status"], "result": json.loads(r["result_json"]) if r["result_json"] else None,
                    "error": r["error"], "created_at": r["created_at"]} for r in cur.fetchall()]
        cur.execute(sql("SELECT result_json FROM cs2_matches WHERE user_id=? AND steam_id=? AND status='complete' AND result_json IS NOT NULL ORDER BY created_at DESC,share_code DESC LIMIT 10"), (user_id, steam_id))
        completed = [{"status": "complete", "result": json.loads(r["result_json"])} for r in cur.fetchall()]
    return {"configured": bool(os.getenv("MATCH_TRACKING_KEY")), "tracking": tracking, "matches": matches,
            "summary": summarize_matches(completed)}


def summarize_matches(matches):
    """Aggregate available completed analyses, not an invented Steam history."""
    results = [m["result"] for m in matches if m["status"] == "complete" and m.get("result")][:10]
    def valid(value):
        return isinstance(value, (int, float)) and not isinstance(value, bool) and 0 <= value < float("inf")
    def ratio(numerator, denominator, multiplier=1):
        pairs = [(r.get(numerator), r.get(denominator)) for r in results]
        pairs = [(a, b) for a, b in pairs if valid(a) and valid(b)]
        total = sum(b for _, b in pairs)
        return round(multiplier * sum(a for a, _ in pairs) / total, 2) if total else None
    return {"count": len(results), "limit": 10, "kd": ratio("kills", "deaths"),
            "hs_percent": ratio("headshots", "kills", 100), "adr": ratio("damage", "rounds"),
            "rounds": sum(r["rounds"] for r in results if valid(r.get("rounds")))}
