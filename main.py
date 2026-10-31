from __future__ import annotations

import asyncio
import json
import os
import re
import secrets
from urllib.parse import quote, urlencode, urlsplit
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
load_dotenv()

from account_store import authenticate_user, consume_steam_login_state, create_session, create_steam_login_state, create_user, delete_session, get_user_for_session, init_database, link_steam_account, persistent_storage_configured, save_faceit_nickname, upsert_steam_user

BASE_DIR = Path(__file__).resolve().parent
FACEIT_API_KEY = os.getenv("FACEIT_API_KEY", "").strip()
FACEIT_GAME_ID = os.getenv("FACEIT_GAME_ID", "cs2").strip() or "cs2"
FACEIT_BASE_URL = "https://open.faceit.com/data/v4"
STEAM_API_KEY = os.getenv("STEAM_API_KEY", "").strip()
STEAM_API_BASE = "https://api.steampowered.com"
STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_APP_ID = 730

app = FastAPI(title="CLONE LAB", version="2.5.0")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

@app.on_event("startup")
async def initialize_account_store() -> None:
    await asyncio.to_thread(init_database)


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



PRO_CONFIG_SNAPSHOT = BASE_DIR / "static" / "pro_players.json"
PRO_CONFIG_INDEX = BASE_DIR / "static" / "player-config-index.json"
PRO_ROSTER_SNAPSHOT = BASE_DIR / "static" / "hltv-top30.json"


def _read_local_json(path: Path) -> Any | None:
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return None


def _local_pro_config_fallback() -> list[dict[str, Any]]:
    """Build truthful player entries from the checked-in config index and roster."""
    config_data = _read_local_json(PRO_CONFIG_INDEX)
    roster_data = _read_local_json(PRO_ROSTER_SNAPSHOT)
    config_items = config_data if isinstance(config_data, list) else []
    by_name: dict[tuple[str, str], dict[str, Any]] = {}

    for entry in config_items:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("player") or entry.get("name") or "").strip()
        team = str(entry.get("team") or "").strip()
        if not name or not team:
            continue
        player = dict(entry)
        player["name"] = name
        player["team"] = team
        player.setdefault("config_file", player.get("file"))
        by_name[(name.casefold(), team.casefold())] = player

    teams = roster_data.get("teams", []) if isinstance(roster_data, dict) else []
    result: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    if isinstance(teams, list):
        for team_entry in teams:
            if not isinstance(team_entry, dict):
                continue
            team = str(team_entry.get("name") or "").strip()
            rank = team_entry.get("rank")
            players = team_entry.get("players", [])
            if not team or not isinstance(players, list):
                continue
            for roster_name in players:
                name = str(roster_name or "").strip()
                key = (name.casefold(), team.casefold())
                if not name or key in seen:
                    continue
                record = dict(by_name.get(key, {}))
                record.update({"name": name, "team": team, "rank": rank})
                result.append(record)
                seen.add(key)

    # If the roster snapshot is unavailable, the config index still provides
    # real player/team/config links without inventing setting values.
    if not result:
        result = list(by_name.values())
    return result


@app.get("/api/pro-configs")
async def pro_configs():
    """Serve the bundled snapshot, then fall back to bundled index/roster files."""
    try:
        snapshot = _read_local_json(PRO_CONFIG_SNAPSHOT)
        items = snapshot.get("players", []) if isinstance(snapshot, dict) else snapshot
        if isinstance(items, list):
            valid_items = [
                item for item in items
                if isinstance(item, dict) and item.get("name") and item.get("team")
            ]
            if valid_items:
                return {
                    "items": valid_items,
                    "source": "static/pro_players.json",
                    "source_url": "https://github.com/Guewenn/cs2-pro-sensitivity-database",
                    "generated_at": snapshot.get("generated_at") if isinstance(snapshot, dict) else None,
                    "cached": True,
                    "fallback": False,
                }
    except (OSError, ValueError, httpx.HTTPError):
        # The checked-in index and roster below are independent local backups.
        pass

    fallback_items = _local_pro_config_fallback()
    return {
        "items": fallback_items,
        "source": "static/player-config-index.json + static/hltv-top30.json",
        "generated_at": None,
        "cached": True,
        "fallback": True,
        "notice": "Ayar snapshot'ı okunamadı; yerel oyuncu/CFG dizini ve kadro yedeği kullanılıyor.",
    }
def _public_base_url(request: Request) -> str:
    base = (os.getenv("PUBLIC_BASE_URL", "").strip() or os.getenv("RENDER_EXTERNAL_URL", "").strip()).rstrip("/")
    if not base:
        if os.getenv("RENDER"):
            raise HTTPException(status_code=503, detail="Steam girişini açmak için sunucuya PUBLIC_BASE_URL ayarlayın.")
        base = str(request.base_url).rstrip("/")
    parts = urlsplit(base)
    if parts.scheme not in ("http", "https") or not parts.netloc or parts.path not in ("", "/"):
        raise HTTPException(status_code=503, detail="PUBLIC_BASE_URL geçerli bir site adresi olmalı.")
    if os.getenv("RENDER") and parts.scheme != "https":
        raise HTTPException(status_code=503, detail="Yayındaki Steam girişi için PUBLIC_BASE_URL https:// ile başlamalı.")
    return base


def _steam_redirect(request: Request, result: str, reason: str | None = None, token: str | None = None) -> RedirectResponse:
    base = (os.getenv("PUBLIC_BASE_URL", "").strip() or os.getenv("RENDER_EXTERNAL_URL", "").strip()).rstrip("/")
    if not base:
        base = str(request.base_url).rstrip("/")
    query = {"steam_login": result}
    if reason:
        query["reason"] = reason
    response = RedirectResponse(f"{base}/?{urlencode(query)}", status_code=303)
    response.delete_cookie("steam_oauth_state", path="/api/auth/steam", httponly=True, secure=os.getenv("COOKIE_SECURE", "").lower() in ("1", "true", "yes"), samesite="lax")
    if token:
        set_session_cookie(response, token)
    return response


async def steam_api_get(interface: str, method: str, params: dict[str, Any]) -> dict[str, Any]:
    if not STEAM_API_KEY:
        raise HTTPException(status_code=503, detail="STEAM_API_KEY sunucuda ayarlanmamış.")
    query = {"key": STEAM_API_KEY, "format": "json", **params}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{STEAM_API_BASE}/{interface}/{method}/v1/" if method != "GetPlayerSummaries" and method != "GetUserStatsForGame" else f"{STEAM_API_BASE}/{interface}/{method}/v2/", params=query)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Steam API bağlantı hatası: {exc.__class__.__name__}") from exc
    if response.status_code in (401, 403):
        raise HTTPException(status_code=502, detail="Steam API erişimi reddedildi. API anahtarını ve profil görünürlüğünü kontrol et.")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Steam API HTTP {response.status_code} döndürdü.")
    try:
        return response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Steam API geçerli JSON döndürmedi.") from exc


async def steam_player_summary(steam_id: str) -> dict[str, Any] | None:
    if not STEAM_API_KEY:
        return None
    try:
        payload = await steam_api_get("ISteamUser", "GetPlayerSummaries", {"steamids": steam_id})
    except HTTPException:
        return None
    players = ((payload.get("response") or {}).get("players") or [])
    return players[0] if players else None


@app.get("/api/auth/steam")
async def steam_auth_start(request: Request, intent: str = Query(default="login", pattern="^(login|link)$")):
    user_id = None
    if intent == "link":
        user = await asyncio.to_thread(get_user_for_session, request.cookies.get("cs2coach_session"))
        if not user:
            raise HTTPException(status_code=401, detail="Steam’i bağlamak için önce Clone Lab hesabına giriş yap.")
        user_id = user["user_id"]
    base = _public_base_url(request)
    state = secrets.token_urlsafe(32)
    await asyncio.to_thread(create_steam_login_state, state, user_id)
    return_to = f"{base}/api/auth/steam/callback?state={quote(state)}"
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": return_to,
        "openid.realm": f"{base}/",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    response = RedirectResponse(f"{STEAM_OPENID_URL}?{urlencode(params)}", status_code=303)
    response.set_cookie("steam_oauth_state", state, max_age=600, path="/api/auth/steam", httponly=True, secure=os.getenv("COOKIE_SECURE", "").lower() in ("1", "true", "yes"), samesite="lax")
    return response


@app.get("/api/auth/steam/callback")
async def steam_auth_callback(request: Request):
    state = request.query_params.get("state", "")
    state_cookie = request.cookies.get("steam_oauth_state", "")
    if not state or not state_cookie or not secrets.compare_digest(state, state_cookie):
        return _steam_redirect(request, "error", "state")
    state_record = await asyncio.to_thread(consume_steam_login_state, state)
    if not state_record:
        return _steam_redirect(request, "error", "expired")
    query = dict(request.query_params)
    if query.get("openid.mode") != "id_res":
        return _steam_redirect(request, "error", "cancelled")
    try:
        base = _public_base_url(request)
    except HTTPException:
        return _steam_redirect(request, "error", "setup")
    expected_return_to = f"{base}/api/auth/steam/callback?state={quote(state)}"
    if query.get("openid.return_to") != expected_return_to or query.get("openid.op_endpoint") != STEAM_OPENID_URL:
        return _steam_redirect(request, "error", "return")
    claimed_id = query.get("openid.claimed_id", "")
    identity = query.get("openid.identity", "")
    match = re.fullmatch(r"https://steamcommunity\.com/openid/id/(\d{17})", claimed_id)
    if not match or identity != claimed_id:
        return _steam_redirect(request, "error", "identity")
    verification = {key: value for key, value in query.items() if key.startswith("openid.")}
    verification["openid.mode"] = "check_authentication"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            verified = await client.post(STEAM_OPENID_URL, data=verification)
        if verified.status_code != 200 or not re.search(r"(?:^|\r?\n)is_valid:true(?:\r?\n|$)", verified.text):
            return _steam_redirect(request, "error", "verify")
    except httpx.HTTPError:
        return _steam_redirect(request, "error", "verify")
    steam_id = match.group(1)
    summary = await steam_player_summary(steam_id)
    persona_name = str(summary.get("personaname") or "") if summary else None
    avatar_url = str(summary.get("avatarfull") or "") if summary else None
    link_user_id = state_record.get("user_id")
    try:
        if link_user_id:
            user = await asyncio.to_thread(link_steam_account, link_user_id, steam_id, persona_name, avatar_url)
            result = "linked"
        else:
            user = await asyncio.to_thread(upsert_steam_user, steam_id, persona_name, avatar_url)
            result = "success"
    except ValueError:
        return _steam_redirect(request, "error", "already_linked")
    token = await asyncio.to_thread(create_session, user["user_id"])
    return _steam_redirect(request, result, token=token)


@app.get("/api/steam/profile")
async def steam_profile(request: Request):
    user = await asyncio.to_thread(get_user_for_session, request.cookies.get("cs2coach_session"))
    if not user:
        raise HTTPException(status_code=401, detail="Önce giriş yap.")
    steam_id = user.get("steam_id")
    if not steam_id:
        raise HTTPException(status_code=404, detail="Bu Clone Lab hesabına Steam bağlı değil.")
    if not STEAM_API_KEY:
        raise HTTPException(status_code=503, detail="Steam API anahtarı sunucuda henüz ayarlanmamış.")
    calls = await asyncio.gather(
        steam_api_get("ISteamUser", "GetPlayerSummaries", {"steamids": steam_id}),
        steam_api_get("IPlayerService", "GetOwnedGames", {"steamid": steam_id, "include_appinfo": 1, "include_played_free_games": 1, "appids_filter[0]": STEAM_APP_ID}),
        steam_api_get("IPlayerService", "GetRecentlyPlayedGames", {"steamid": steam_id, "count": 0}),
        steam_api_get("ISteamUserStats", "GetUserStatsForGame", {"steamid": steam_id, "appid": STEAM_APP_ID}),
        return_exceptions=True,
    )
    summary_data = calls[0] if isinstance(calls[0], dict) else None
    owned_data = calls[1] if isinstance(calls[1], dict) else None
    recent_data = calls[2] if isinstance(calls[2], dict) else None
    stats_data = calls[3] if isinstance(calls[3], dict) else None
    summary_list = ((summary_data or {}).get("response") or {}).get("players") or []
    profile = summary_list[0] if summary_list else {}
    owned_games = ((owned_data or {}).get("response") or {}).get("games") or []
    recent_games = ((recent_data or {}).get("response") or {}).get("games") or []
    owned_cs2 = next((game for game in owned_games if int(game.get("appid", 0) or 0) == STEAM_APP_ID), None)
    recent_cs2 = next((game for game in recent_games if int(game.get("appid", 0) or 0) == STEAM_APP_ID), None)
    player_stats = (stats_data or {}).get("playerstats") or {}
    stats = player_stats.get("stats") if player_stats.get("success") else None
    stats = [{"name": str(item.get("name", "")), "value": item.get("value")} for item in (stats or []) if isinstance(item, dict) and item.get("name") and isinstance(item.get("value"), (int, float, str))]
    playtime = owned_cs2.get("playtime_forever") if owned_cs2 else None
    recent_playtime = recent_cs2.get("playtime_2weeks") if recent_cs2 else None
    failures = ["profile" if not isinstance(calls[0], dict) else None, "owned_games" if not isinstance(calls[1], dict) else None, "recent_playtime" if not isinstance(calls[2], dict) else None, "stats" if not isinstance(calls[3], dict) else None]
    return {
        "steam": {
            "steam_id": steam_id,
            "persona_name": profile.get("personaname") or user.get("steam_persona_name") or user["username"],
            "avatar_url": profile.get("avatarfull") or user.get("steam_avatar_url"),
            "profile_url": profile.get("profileurl") or f"https://steamcommunity.com/profiles/{steam_id}/",
            "visibility_state": profile.get("communityvisibilitystate"),
            "profile_state": profile.get("profilestate"),
        },
        "cs2": {
            "app_id": STEAM_APP_ID,
            "playtime_minutes": playtime,
            "recent_playtime_minutes": recent_playtime,
            "stats": stats,
            "stats_available": bool(stats),
            "match_history": {"available": False, "message": "Steam Web API kişisel CS2 maç maç geçmişi sunmuyor. Bu bölüm ELO veya sonuç uydurmaz; FACEIT maçları FACEIT sekmesinde gösterilir."},
        },
        "unavailable_sources": [item for item in failures if item],
        "source": "Steam Web API · CS2 AppID 730",
        "privacy_note": "Steam profilin veya oyun ayrıntıların gizliyse oyun süresi ve istatistikler eksik dönebilir.",
    }

@app.get("/api/health")
async def health():
    return {"ok": True, "faceit_key_configured": bool(FACEIT_API_KEY), "steam_api_key_configured": bool(STEAM_API_KEY), "game_id": FACEIT_GAME_ID}


@app.get("/api/account")
async def account(request: Request):
    user = await asyncio.to_thread(get_user_for_session, request.cookies.get("cs2coach_session"))
    if not user:
        return {"authenticated": False, "persistent_storage": persistent_storage_configured()}
    return {"authenticated": True, "username": user.get("steam_persona_name") or user["username"], "faceit_nickname": user.get("faceit_nickname"), "steam_id": user.get("steam_id"), "steam_persona_name": user.get("steam_persona_name"), "steam_avatar_url": user.get("steam_avatar_url"), "persistent_storage": persistent_storage_configured()}


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        "cs2coach_session", token, max_age=60 * 60 * 24 * 30, path="/",
        httponly=True, secure=os.getenv("COOKIE_SECURE", "").lower() in ("1", "true", "yes"),
        samesite="strict",
    )


@app.post("/api/account/register")
async def register_account(payload: dict[str, Any], request: Request, response: Response):
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,32}", username):
        raise HTTPException(status_code=400, detail="Kullanıcı adı 3-32 karakter olmalı; harf, rakam, nokta, tire ve alt çizgi kullan.")
    if len(password) < 8 or len(password) > 128:
        raise HTTPException(status_code=400, detail="Parola 8-128 karakter arasında olmalı.")
    try:
        user = await asyncio.to_thread(create_user, username, password)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    await asyncio.to_thread(delete_session, request.cookies.get("cs2coach_session"))
    token = await asyncio.to_thread(create_session, user["user_id"])
    set_session_cookie(response, token)
    return {"authenticated": True, "username": username, "faceit_nickname": None, "persistent_storage": persistent_storage_configured()}


@app.post("/api/account/login")
async def login_account(payload: dict[str, Any], request: Request, response: Response):
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    user = await asyncio.to_thread(authenticate_user, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya parola hatalı.")
    await asyncio.to_thread(delete_session, request.cookies.get("cs2coach_session"))
    token = await asyncio.to_thread(create_session, user["user_id"])
    set_session_cookie(response, token)
    return {"authenticated": True, "username": user.get("steam_persona_name") or user["username"], "faceit_nickname": user.get("faceit_nickname"), "steam_id": user.get("steam_id"), "steam_persona_name": user.get("steam_persona_name"), "steam_avatar_url": user.get("steam_avatar_url"), "persistent_storage": persistent_storage_configured()}


@app.post("/api/account/logout")
async def logout_account(request: Request, response: Response):
    await asyncio.to_thread(delete_session, request.cookies.get("cs2coach_session"))
    response.delete_cookie("cs2coach_session", path="/", httponly=True, secure=os.getenv("COOKIE_SECURE", "").lower() in ("1", "true", "yes"), samesite="strict")
    return {"authenticated": False, "persistent_storage": persistent_storage_configured()}


@app.post("/api/account/faceit")
async def save_faceit_profile(payload: dict[str, Any], request: Request):
    user = await asyncio.to_thread(get_user_for_session, request.cookies.get("cs2coach_session"))
    if not user:
        raise HTTPException(status_code=401, detail="Önce CS2 Coach hesabına giriş yap.")
    nickname = str(payload.get("nickname", "")).strip()
    if not re.fullmatch(r"[\w .-]{2,40}", nickname, flags=re.UNICODE):
        raise HTTPException(status_code=400, detail="Geçerli bir FACEIT kullanıcı adı gir.")
    profile = await faceit_get("/players", {"nickname": nickname, "game": FACEIT_GAME_ID})
    if not profile.get("player_id"):
        raise HTTPException(status_code=404, detail="FACEIT bu kullanıcı adı için oyuncu profili döndürmedi.")
    canonical_nickname = str(profile.get("nickname") or nickname)
    await asyncio.to_thread(save_faceit_nickname, user["user_id"], canonical_nickname)
    return {"saved": True, "faceit_nickname": canonical_nickname, "ownership_verified": False, "persistent_storage": persistent_storage_configured()}

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
        "faceit_url": (result.get("faceit_url") or "").replace("{lang}", "en").replace("{player_id}", str(result.get("player_id") or "")),
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
        winner = str(results.get("winner") or "")
        my_team_key = next((key for key, team in teams.items() if any(player.get("player_id") == player_id for player in team.get("players", []))), None)
        winning_team_key = winner if winner in teams else next((key for key, team in teams.items() if team.get("team_id") == winner), None)
        won = (my_team_key == winning_team_key) if my_team_key is not None and winning_team_key is not None else None
        match_id = item.get("match_id")
        faceit_url = item.get("faceit_url") or ""
        if faceit_url:
            faceit_url = faceit_url.replace("{lang}", "en").replace("{match_id}", str(match_id or ""))
        elif match_id:
            faceit_url = f"https://www.faceit.com/en/cs2/room/{match_id}"
        normalized.append({
            "match_id": match_id,
            "finished_at": item.get("finished_at"),
            "game_mode": item.get("game_mode"),
            # The history endpoint may expose queue type rather than an actual map.
            "map": item.get("map_name") or item.get("map") or None,
            "match_type": item.get("match_type"),
            "competition_name": item.get("competition_name"),
            "results": results,
            "won": won,
            "teams": teams,
            "faceit_url": faceit_url or None,
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


@app.get("/api/player/{player_id}/match-stats")
async def player_match_stats(player_id: str, limit: int = Query(default=20, ge=1, le=100)):
    """Return FACEIT's per-match stats without discarding provider fields."""
    response = await faceit_get(
        f"/players/{player_id}/games/{FACEIT_GAME_ID}/stats",
        {"offset": 0, "limit": limit},
    )
    items = response.get("items") or []
    rows = [item.get("stats") or {} for item in items]
    fields = sorted({str(key) for row in rows for key in row})
    field_coverage = {field: sum(field in row and row.get(field) not in (None, "") for row in rows) for field in fields}

    def values(*aliases: str) -> list[float]:
        return [value for row in rows if (value := numeric(row, *aliases)) is not None]

    def mean(values_to_average: list[float]) -> float | None:
        return round(sum(values_to_average) / len(values_to_average), 2) if values_to_average else None

    kills = values("Kills", "kills", "Total Kills")
    deaths = values("Deaths", "deaths", "Total Deaths")
    headshots = values("Headshots", "Headshot Kills", "HS Kills")
    direct_hs = values("Headshots %", "Headshot %", "HS %", "Headshot Percentage")
    total_kills = sum(kills) if kills else None
    total_deaths = sum(deaths) if deaths else None
    kd_values = values("K/D Ratio", "K/D", "KD Ratio")
    kd = round(total_kills / total_deaths, 2) if total_kills is not None and total_deaths else mean(kd_values)
    hs_source = next((key for key in ("Headshots %", "Headshot %", "HS %", "Headshot Percentage") if any(key in row and row.get(key) not in (None, "") for row in rows)), None)
    if headshots and kills and len(headshots) == len(rows) and len(kills) == len(rows) and total_kills:
        hs_pct = round(sum(headshots) / total_kills * 100, 2)
        hs_source = "derived: Headshots / Kills"
    else:
        hs_pct = mean(direct_hs)

    field_summary = {}
    for field in fields:
        lowered = field.casefold()
        if re.search(r"(^|[^a-z])(id|time|date)([^a-z]|$)", lowered) or "finished at" in lowered:
            continue
        field_values = [value for row in rows if (value := numeric(row, field)) is not None]
        if field_values:
            field_summary[field] = {
                "average": mean(field_values),
                "min": min(field_values),
                "max": max(field_values),
                "count": len(field_values),
            }

    normalized_items = []
    for item, row in zip(items, rows):
        match_id = next((row[key] for key in ("Match Id", "Match ID", "match_id", "Match") if row.get(key)), None)
        finished_at = next((row[key] for key in ("Match Finished At", "Finished At", "finished_at") if row.get(key)), None)
        map_name = next((row[key] for key in ("Map", "Map Name", "map", "map_name") if row.get(key)), None)
        normalized_items.append({"match_id": match_id, "finished_at": finished_at, "map": map_name, "stats": row})

    series = {"kd": [], "hs_pct": [], "adr": []}
    for item in normalized_items:
        row = item["stats"]
        kd_value = numeric(row, "K/D Ratio", "K/D", "KD Ratio")
        hs_value = numeric(row, "Headshots %", "Headshot %", "HS %", "Headshot Percentage")
        row_kills = numeric(row, "Kills", "kills", "Total Kills")
        row_headshots = numeric(row, "Headshots", "Headshot Kills", "HS Kills")
        if hs_value is None and row_kills and row_headshots is not None:
            hs_value = row_headshots / row_kills * 100
        adr_value = numeric(row, "ADR", "Average Damage per Round")
        for key, value in (("kd", kd_value), ("hs_pct", hs_value), ("adr", adr_value)):
            if value is not None:
                series[key].append({"match_id": item["match_id"], "finished_at": item["finished_at"], "value": round(value, 2)})
    return {
        "source": "FACEIT Data API per-match player stats",
        "requested_limit": limit,
        "count": len(rows),
        "fields": fields,
        "field_coverage": field_coverage,
        "field_summary": field_summary,
        "metric_sources": {"headshot_pct": hs_source or "not returned by FACEIT"},
        "metrics": {
            "kills_per_match": mean(kills),
            "deaths_per_match": mean(deaths),
            "assists_per_match": mean(values("Assists", "assists")),
            "headshots_per_match": mean(headshots),
            "headshot_pct": hs_pct,
            "kd": kd,
            "kr": mean(values("K/R Ratio", "K/R", "Kills per Round")),
            "adr": mean(values("ADR", "Average Damage per Round")),
            "mvp_per_match": mean(values("MVPs", "MVP")),
        },
        "items": normalized_items,
        "series": series,
    }

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
    recent_stats = payload.get("recent_stats") or {}
    recent_metrics = recent_stats.get("metrics") or {}
    adr = recent_metrics.get("adr")
    if adr is None:
        adr = numeric(lifetime, "Average Damage per Round", "ADR", "Average Damage")
    kd = recent_metrics.get("kd")
    if kd is None:
        kd = numeric(lifetime, "K/D Ratio", "K/D", "KD Ratio")
    hs = recent_metrics.get("headshot_pct")
    if hs is None:
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
        "source": "FACEIT Data API lifetime stats, per-match stats, and match history",
        "confidence_note": "Bunlar istatistiklerden türetilen başlangıç önerileridir; demo izlenmeden kesin mekanik veya taktik hata teşhisi yapılmaz.",
        "metrics_detected": {"win_rate": win_rate, "adr": adr, "kd": kd, "headshot_pct": hs},
        "recent_results": {"wins": recent_wins, "losses": len(known_matches) - recent_wins, "matches_with_result": len(known_matches), "win_rate": round(recent_wins / len(known_matches) * 100, 1) if known_matches else None},
        "recommendations": report,
        "segments_count": len(segments),
    }
