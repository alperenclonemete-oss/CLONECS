from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
FACEIT_API_KEY = os.getenv("FACEIT_API_KEY", "").strip()
FACEIT_GAME_ID = os.getenv("FACEIT_GAME_ID", "cs2").strip() or "cs2"
FACEIT_BASE_URL = "https://open.faceit.com/data/v4"

app = FastAPI(title="CS2 Coach MVP", version="0.1.0")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.get("/")
async def home():
    return FileResponse(BASE_DIR / "static" / "index.html")


async def faceit_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    if not FACEIT_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="FACEIT_API_KEY ayarlanmamış. .env dosyasına sunucu tarafı API anahtarını ekleyin.",
        )
    headers = {"Authorization": f"Bearer {FACEIT_API_KEY}", "Accept": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(f"{FACEIT_BASE_URL}{path}", params=params, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"FACEIT API bağlantı hatası: {exc.__class__.__name__}") from exc
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="FACEIT üzerinde oyuncu veya kayıt bulunamadı.")
    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="FACEIT API istek sınırına ulaşıldı. Biraz sonra tekrar deneyin.")
    if response.status_code in (401, 403):
        raise HTTPException(status_code=502, detail="FACEIT API anahtarı geçersiz veya bu istek için yetkisiz.")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"FACEIT API hata döndürdü (HTTP {response.status_code}).")
    try:
        return response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="FACEIT API geçerli JSON döndürmedi.") from exc


@app.get("/api/health")
async def health():
    return {"ok": True, "faceit_key_configured": bool(FACEIT_API_KEY), "game_id": FACEIT_GAME_ID}


@app.get("/api/player")
async def player(nickname: str = Query(min_length=2, max_length=40)):
    nickname = nickname.strip()
    if not re.fullmatch(r"[\w .-]+", nickname, flags=re.UNICODE):
        raise HTTPException(status_code=400, detail="Kullanıcı adında desteklenmeyen karakterler var.")
    result = await faceit_get("/players", {"nickname": nickname, "game": FACEIT_GAME_ID})
    games = result.get("games") or {}
    game = games.get(FACEIT_GAME_ID) or games.get("csgo") or {}
    return {
        "player_id": result.get("player_id"),
        "nickname": result.get("nickname"),
        "avatar": result.get("avatar"),
        "country": result.get("country"),
        "faceit_url": result.get("faceit_url"),
        "skill_level": game.get("skill_level"),
        "elo": game.get("faceit_elo"),
        "game_id_used": FACEIT_GAME_ID,
    }


@app.get("/api/player/{player_id}/matches")
async def matches(player_id: str, limit: int = Query(default=20, ge=1, le=50)):
    result = await faceit_get(f"/players/{player_id}/history", {"game": FACEIT_GAME_ID, "limit": limit})
    items = result.get("items", [])
    normalized = []
    for item in items:
        teams = item.get("teams") or {}
        results = item.get("results") or {}
        winner = results.get("winner")
        my_team = next((team for team in teams.values() if any(player.get("player_id") == player_id for player in team.get("players", []))), None)
        won = (my_team.get("team_id") == winner) if my_team and winner else None
        normalized.append({
            "match_id": item.get("match_id"),
            "finished_at": item.get("finished_at"),
            "game_mode": item.get("game_mode"),
            # The history endpoint may expose queue type rather than an actual map.
            "map": item.get("map_name") or item.get("map") or None,
            "match_type": item.get("match_type"),
            "competition_name": item.get("competition_name"),
            "results": results,
            "won": won,
            "teams": teams,
            "faceit_url": item.get("faceit_url"),
        })
    return {"items": normalized, "count": len(normalized)}


@app.get("/api/player/{player_id}/stats")
async def stats(player_id: str):
    return await faceit_get(f"/players/{player_id}/stats/{FACEIT_GAME_ID}")


@app.get("/api/match/{match_id}")
async def match_details(match_id: str):
    return await faceit_get(f"/matches/{match_id}")


@app.get("/api/match/{match_id}/stats")
async def match_stats(match_id: str):
    return await faceit_get(f"/matches/{match_id}/stats")


def numeric(stats: dict[str, Any], *keys: str) -> float | None:
    for key in keys:
        value = stats.get(key)
        if value is None:
            continue
        try:
            return float(str(value).replace("%", "").replace(",", "."))
        except (TypeError, ValueError):
            continue
    return None


@app.post("/api/coach-report")
async def coach_report(payload: dict[str, Any]):
    """Explain available FACEIT stats with transparent, simple heuristics; no invented demo insights."""
    stats_data = payload.get("stats") or {}
    lifetime = stats_data.get("lifetime") or {}
    segments = stats_data.get("segments") or []
    report: list[dict[str, str]] = []

    matches = payload.get("matches") or []
    known_matches = [match for match in matches if match.get("won") is not None]
    recent_wins = sum(match.get("won") is True for match in known_matches)
    if known_matches:
        recent_rate = recent_wins / len(known_matches) * 100
        if len(known_matches) >= 5 and recent_rate < 45:
            report.append({"priority": "Orta", "title": "Yakın dönem sonuçlarını gözden geçir", "body": f"FACEIT geçmişinde sonucu bilinen {len(known_matches)} maçın {recent_wins} tanesini kazandın (%{recent_rate:.0f}). Bu sonuç tek başına kişisel hatayı göstermez. İki yakın mağlubiyette round kararlarını ve takım skorunu incele."})
        elif len(known_matches) >= 5 and recent_rate >= 55:
            report.append({"priority": "Bilgi", "title": "İşe yarayan koşulları koru", "body": f"Sonucu bilinen {len(known_matches)} maçta {recent_wins} galibiyet var (%{recent_rate:.0f}). Yakın mağlubiyetleri inceleyip tekrar edilebilir iyi alışkanlıkları belirle."})
        elif len(known_matches) < 5:
            report.append({"priority": "Bilgi", "title": "Sonuç verisi henüz sınırlı", "body": f"Yalnızca {len(known_matches)} maçın sonucu alınabildi. Güvenilir yakın dönem eğilimi çıkarmak için bu örneklem küçük; daha fazla maç verisi bekle."})
        else:
            report.append({"priority": "Bilgi", "title": "Yakın dönem performansını takip et", "body": f"Sonucu bilinen {len(known_matches)} maçta galibiyet oranı %{recent_rate:.0f}. Bu sınırlı dönem için dengeli bir sonuç; aynı örneklemi büyütüp tekrar kontrol et."})

    map_records: dict[str, list[bool]] = {}
    for match in known_matches:
        map_name = match.get("map")
        if map_name:
            map_records.setdefault(str(map_name), []).append(match["won"] is True)
    for map_name, outcomes in map_records.items():
        if len(outcomes) >= 3:
            rate = sum(outcomes) / len(outcomes) * 100
            report.append({"priority": "Bilgi", "title": f"Harita verisi: {map_name}", "body": f"FACEIT yanıtında bu haritada {len(outcomes)} sonuç ve %{rate:.0f} galibiyet oranı var. Bu en az üç maçlık küçük bir örneklemdir."})

    win_rate = numeric(lifetime, "Win Rate %", "Win Rate", "win_rate")
    adr = numeric(lifetime, "Average Damage per Round", "ADR", "Average Damage")
    kd = numeric(lifetime, "K/D Ratio", "K/D", "KD Ratio")
    hs = numeric(lifetime, "Headshots %", "Headshot %", "HS %")

    if win_rate is not None:
        if win_rate < 48:
            report.append({"priority": "Orta", "title": "Maç sonuçlarını bağlamıyla incele", "body": f"Görünen kazanma oranı %{win_rate:.1f}. Tek başına bu sayı kişisel hatayı kanıtlamaz. Son maçlarda harita, taraf ve takım skoruyla birlikte incele."})
        elif win_rate >= 55:
            report.append({"priority": "Bilgi", "title": "İyi giden koşulları belirle", "body": f"Görünen kazanma oranı %{win_rate:.1f}. En iyi harita ve taraf performansını ayırıp tekrar edilebilir alışkanlıkları belirle."})
    if adr is not None:
        if adr < 65:
            report.append({"priority": "Yüksek", "title": "Round başına hasarı incele", "body": f"Görünen ADR {adr:.1f}. Daha fazla etkili temas, trade ve utility hasarı fırsatlarını demo üzerinden kontrol et. ADR tek başına aim kalitesini ölçmez."})
        elif adr >= 80:
            report.append({"priority": "Bilgi", "title": "Hasarı round kazanımına dönüştür", "body": f"Görünen ADR {adr:.1f}. Hasarının ne kadarının round kazandıran temaslarda ve trade'lerde geldiğini incele."})
    if kd is not None:
        if kd < 0.9:
            report.append({"priority": "Yüksek", "title": "Düello kalitesini kontrol et", "body": f"Görünen K/D {kd:.2f}. Demo incelemesinde ilk ölüm, yalnız düello ve trade edilebilir pozisyonlara bak. Bu metrik tek başına aim sorunu anlamına gelmez."})
        elif kd >= 1.15:
            report.append({"priority": "Bilgi", "title": "Avantajı takım oyununa taşı", "body": f"Görünen K/D {kd:.2f}. İlk kill sonrası hayatta kalma, trade katkısı ve round kapanışlarını kontrol et."})
    if hs is not None:
        if hs < 40:
            report.append({"priority": "Orta", "title": "Crosshair placement rutini", "body": f"Görünen HS oranı %{hs:.1f}. 10 dakika kontrollü pre-aim ve durarak ilk mermi çalışması dene. HS oranı silah seçimi ve rolünden de etkilenir."})

    if not report:
        report.append({"priority": "Başlangıç", "title": "Veri kapsamı sınırlı", "body": "API yanıtında tanınan lifetime metrikleri bulunamadı. Ham veriyi kontrol edin veya maç istatistikleri uç noktasını kullanın. Bu aşamada kişisel hata teşhisi yapılmıyor."})

    return {
        "source": "FACEIT Data API player stats and recent match history",
        "confidence_note": "Bunlar istatistiklerden türetilen başlangıç önerileridir; demo izlenmeden kesin mekanik veya taktik hata teşhisi yapılmaz.",
        "metrics_detected": {"win_rate": win_rate, "adr": adr, "kd": kd, "headshot_pct": hs},
        "recent_results": {"wins": recent_wins, "losses": len(known_matches) - recent_wins, "matches_with_result": len(known_matches), "win_rate": round(recent_wins / len(known_matches) * 100, 1) if known_matches else None},
        "recommendations": report,
        "segments_count": len(segments),
    }
