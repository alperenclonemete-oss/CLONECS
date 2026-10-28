"""CS2 Coach: small, server-rendered-by-the-browser FACEIT Data API MVP."""
from __future__ import annotations

import asyncio
import os
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
API = "https://open.faceit.com/data/v4"
app = FastAPI(title="CS2 Coach", version="0.1.0")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


def faceit_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    key = os.getenv("FACEIT_API_KEY", "").strip()
    if not key:
        raise HTTPException(503, "FACEIT_API_KEY is not configured on the server.")
    url = f"{API}{path}"
    if params:
        url += "?" + urlencode(params)
    request = Request(url, headers={"Authorization": f"Bearer {key}", "Accept": "application/json", "User-Agent": "CS2-Coach/0.1"})
    try:
        with urlopen(request, timeout=12) as response:
            import json
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code == 404:
            raise HTTPException(404, "FACEIT player or data was not found.") from exc
        if exc.code == 429:
            raise HTTPException(429, "FACEIT rate limit reached. Please retry shortly.") from exc
        if exc.code in (401, 403):
            raise HTTPException(502, "FACEIT rejected the server API key or its permissions.") from exc
        raise HTTPException(502, f"FACEIT API returned HTTP {exc.code}.") from exc
    except (URLError, TimeoutError) as exc:
        raise HTTPException(502, "Could not reach the FACEIT API. Please try again.") from exc


def number(value: Any) -> float | None:
    try:
        return float(str(value).replace("%", "").replace(",", "."))
    except (TypeError, ValueError):
        return None


def int_or_none(value: Any) -> int | None:
    n = number(value)
    return int(n) if n is not None else None


def faceit_url(value: Any, **parts: str) -> str | None:
    if not isinstance(value, str) or not value:
        return None
    for key, part in parts.items():
        value = value.replace("{" + key + "}", quote(part, safe=""))
    return value


def player_match_stats(player_id: str, game: str, limit: int = 20) -> dict[str, Any]:
    """Return FACEIT's per-match stats payload without renaming or inventing fields."""
    return faceit_get(f"/players/{quote(player_id, safe='')}/games/{quote(game, safe='')}/stats", {"offset": 0, "limit": limit})


def summarize_match_stats(payload: dict[str, Any]) -> dict[str, Any]:
    items = payload.get("items") or []
    rows = [item.get("stats") or {} for item in items if isinstance(item, dict)]
    field_names = sorted({str(k) for row in rows for k in row})

    def get_value(row: dict[str, Any], aliases: tuple[str, ...]) -> float | None:
        lowered = {str(k).strip().lower(): v for k, v in row.items()}
        for alias in aliases:
            if alias.lower() in lowered:
                return number(lowered[alias.lower()])
        return None

    metric_specs = {
        "kills": ("Kills", "Total Kills"), "deaths": ("Deaths", "Total Deaths"),
        "assists": ("Assists", "Total Assists"), "headshots": ("Headshots", "Total Headshots"),
        "adr": ("ADR", "Average Damage per Round"), "kd": ("K/D Ratio", "K/D"),
        "kr": ("K/R Ratio", "K/R"), "hs_percent": ("Headshots %", "HS %", "HS%", "Headshot %"),
    }
    metrics: dict[str, Any] = {}
    series: dict[str, list[dict[str, Any]]] = {key: [] for key in metric_specs}
    for metric_name, aliases in metric_specs.items():
        points = []
        for item in items:
            if not isinstance(item, dict):
                continue
            row = item.get("stats") or {}
            value = get_value(row, aliases)
            if metric_name == "hs_percent" and value is None:
                hs, kills = get_value(row, metric_specs["headshots"]), get_value(row, metric_specs["kills"])
                value = (hs / kills * 100) if hs is not None and kills else None
            if value is not None:
                points.append({"match_id": item.get("match_id") or row.get("MatchId") or row.get("match_id"), "value": round(value, 2)})
        series[metric_name] = points
        if points:
            values = [p["value"] for p in points]
            metrics[metric_name] = {"average": round(sum(values) / len(values), 2), "min": min(values), "max": max(values), "matches": len(values)}
        else:
            metrics[metric_name] = None
    return {"matches_returned": len(rows), "fields": field_names, "metrics": metrics, "series": series, "items": items,
            "notice": "These are per-match fields returned by FACEIT. A missing metric means the API did not provide a usable value."}


def advice(matches: list[dict[str, Any]], stats: dict[str, Any], profile: dict[str, Any]) -> list[dict[str, str]]:
    tips: list[dict[str, str]] = []
    lifetime = stats.get("lifetime") or {}
    recent_metrics = (stats.get("_recent") or {}).get("metrics") or {}
    wins = sum(1 for m in matches if m.get("won") is True)
    known = sum(1 for m in matches if m.get("won") is not None)
    if known >= 5:
        wr = wins / known * 100
        if wr < 45:
            tips.append({"title": "Review round decisions", "text": f"You won {wins} of the {known} recent matches with a reported result ({wr:.0f}%). Review two lost rounds per session and note the first decision that put your team at a disadvantage. This is a recent-results signal, not proof of a specific mechanical issue."})
        elif wr >= 55:
            tips.append({"title": "Keep what is working", "text": f"You won {wins} of {known} recent matches with a reported result ({wr:.0f}%). Keep your current routine and review close losses for one repeatable improvement."})
        else:
            tips.append({"title": "Build consistency", "text": f"Your recent result rate is {wr:.0f}% across {known} matches. Track one goal per map (trade spacing, utility use, or crosshair placement) and review whether you completed it."})
    elif known:
        tips.append({"title": "Collect more match evidence", "text": f"Only {known} recent match results were available, which is too little to identify a reliable strength or weakness. Play a few more matches, then compare the same indicators again."})

    kd = number(lifetime.get("Average K/D Ratio") or lifetime.get("K/D Ratio"))
    if kd is not None:
        if kd < 0.9:
            tips.append({"title": "Practice deliberate duels", "text": f"FACEIT reports a lifetime K/D of {kd:.2f}. Warm up with short, controlled counter-strafe and first-bullet accuracy drills; judge the session by clean attempts rather than volume."})
        elif kd >= 1.1:
            tips.append({"title": "Turn impact into round wins", "text": f"FACEIT reports a lifetime K/D of {kd:.2f}. In demos, check whether your kills create space, trades, or objective progress; K/D alone does not show round impact."})
    hs = recent_metrics.get("hs_percent")
    if hs and hs.get("matches", 0) >= 5:
        value = hs["average"]
        if value < 35:
            tips.append({"title": "Check first bullet placement", "text": f"FACEIT reports a {value:.1f}% average headshot rate across {hs['matches']} recent matches. Use a short deathmatch block focused on crosshair height and deliberate first bullets; this stat alone cannot identify the cause."})
        else:
            tips.append({"title": "Keep your aim routine consistent", "text": f"FACEIT reports a {value:.1f}% average headshot rate across {hs['matches']} recent matches. Keep the routine steady and review whether those hits convert into round impact."})
    adr = recent_metrics.get("adr")
    if adr and adr.get("matches", 0) >= 5 and adr["average"] < 65:
        tips.append({"title": "Look for safe damage opportunities", "text": f"FACEIT reports {adr['average']:.1f} average damage per round across {adr['matches']} recent matches. Review utility damage, trade timing, and whether you are participating in early-round fights before changing your aim practice."})
    if not tips:
        tips.append({"title": "Start with a simple routine", "text": "The available FACEIT data does not expose enough performance detail for a personalized diagnosis yet. Use a 10-minute aim warm-up, then review one lost round and record a specific, observable adjustment."})
    tips.append({"title": "Data limits", "text": "These suggestions use only the fields returned by FACEIT. The Data API does not provide demo-level positioning, aim quality, or decision context here, so this is not a substitute for demo review."})
    return tips


@app.get("/")
def home() -> FileResponse:
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "faceit_key": "configured" if os.getenv("FACEIT_API_KEY") else "missing"}


@app.get("/api/player/{nickname}")
async def player(nickname: str, limit: int = Query(20, ge=5, le=50)) -> dict[str, Any]:
    nickname = nickname.strip()
    if not nickname or len(nickname) > 50:
        raise HTTPException(400, "Enter a valid FACEIT nickname.")
    profile = await asyncio.to_thread(faceit_get, "/players", {"nickname": nickname, "game": "cs2"})
    player_id = profile.get("player_id")
    if not player_id:
        raise HTTPException(404, "FACEIT did not return a player ID for that nickname.")
    games = profile.get("games") or {}
    game = "cs2" if "cs2" in games else ("csgo" if "csgo" in games else "cs2")
    history_call = asyncio.to_thread(faceit_get, f"/players/{quote(player_id, safe='')}/history", {"game": game, "offset": 0, "limit": limit})
    stats_call = asyncio.to_thread(faceit_get, f"/players/{quote(player_id, safe='')}/stats/{game}")
    match_stats_call = asyncio.to_thread(player_match_stats, player_id, game, min(limit, 20))
    history, stats, match_stats = await asyncio.gather(history_call, stats_call, match_stats_call, return_exceptions=True)
    if isinstance(history, Exception):
        if isinstance(history, HTTPException):
            raise history
        raise HTTPException(502, "Could not retrieve match history from FACEIT.") from history
    if isinstance(stats, Exception):
        stats = {"lifetime": {}, "segments": []}
    if isinstance(match_stats, Exception):
        match_stats = {"items": []}
    items = history.get("items", [])
    matches = []
    for item in items:
        teams = item.get("teams") or {}
        my_team = next((team for team in teams.values() if any(p.get("player_id") == player_id for p in team.get("players", []))), None)
        winner = (item.get("results") or {}).get("winner")
        my_team_key = next((key for key, team in teams.items() if team is my_team), None)
        winning_team = next((team for key, team in teams.items() if winner and (str(key).lower() == str(winner).lower() or str(team.get("team_id", "")).lower() == str(winner).lower())), None)
        outcome = True if my_team is not None and winning_team is my_team else (False if my_team is not None and winning_team is not None else None)
        map_name = item.get("map")
        matches.append({
            "id": item.get("match_id"), "map": map_name, "finished_at": item.get("finished_at"),
            "won": outcome, "score": (item.get("results") or {}).get("score"), "url": faceit_url(item.get("faceit_url"), lang="en", match_id=str(item.get("match_id") or "")),
            "mode": item.get("game_mode"),
            "team": my_team.get("nickname") if my_team else None, "team_key": my_team_key,
        })
    known_results = [m for m in matches if m["won"] is not None]
    lifetime = stats.get("lifetime") or {}
    recent_summary = summarize_match_stats(match_stats)
    recommendation_stats = {**stats, "_recent": recent_summary}
    return {
        "source": "FACEIT Data API", "retrieved_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "player": {"nickname": profile.get("nickname", nickname), "avatar": profile.get("avatar"), "country": profile.get("country"), "faceit_url": faceit_url(profile.get("faceit_url"), lang="en", player_id=player_id), "player_id": player_id, "elo": int_or_none((games.get(game) or {}).get("faceit_elo")), "level": int_or_none((games.get(game) or {}).get("skill_level"))},
        "matches": matches,
        "summary": {"matches_returned": len(matches), "results_available": len(known_results), "wins": sum(m["won"] is True for m in known_results), "losses": sum(m["won"] is False for m in known_results), "win_rate": round(100 * sum(m["won"] is True for m in known_results) / len(known_results), 1) if known_results else None,
                    "lifetime": lifetime, "segments": stats.get("segments") or [], "recent": recent_summary},
        "recommendations": advice(matches, recommendation_stats, profile),
        "notice": "FACEIT provides match results and limited statistics. Missing fields are shown as unavailable; recommendations are based only on returned data.",
    }


@app.get("/api/match/{match_id}")
async def match_detail(match_id: str) -> dict[str, Any]:
    if not match_id or len(match_id) > 100:
        raise HTTPException(400, "Invalid FACEIT match ID.")
    details_call = asyncio.to_thread(faceit_get, f"/matches/{quote(match_id, safe='')}")
    stats_call = asyncio.to_thread(faceit_get, f"/matches/{quote(match_id, safe='')}/stats")
    details, stats = await asyncio.gather(details_call, stats_call, return_exceptions=True)
    if isinstance(details, Exception):
        if isinstance(details, HTTPException):
            raise details
        raise HTTPException(502, "Could not retrieve match details from FACEIT.") from details
    if isinstance(stats, Exception):
        stats = {"rounds": []}
    details["faceit_url"] = faceit_url(details.get("faceit_url"), lang="en", match_id=match_id)
    return {"match": details, "stats": stats}
