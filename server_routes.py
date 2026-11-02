"""Public provider directories; no arbitrary host probing or user supplied URLs."""
import asyncio
import ipaddress
import json
import time
from pathlib import Path

import httpx
from fastapi import APIRouter

router = APIRouter()
PROVIDERS = {
    "warmup": ("WarmupServer", "https://warmupserver.net/servers.php", "https://warmupserver.net/api/servercards/query.php"),
    "cybershoke": ("CYBERSHOKE", "https://cybershoke.net/cs2", "https://cybershoke.net/api/api/v2/main/data"),
    "xplay": ("XPLAY.GG", "https://xplay.gg/servers", None),
    "pracc": ("PRACC", "https://pracc.com/play", None),
}
try:
    _cache = json.loads((Path(__file__).parent / "static/server-directory-snapshot.json").read_text(encoding="utf-8"))
except (OSError, ValueError):
    _cache = {}
_lock = asyncio.Lock()
_checked = 0


def address(value):
    try:
        host, port = str(value).rsplit(":", 1)
        ip = ipaddress.ip_address(host)
        if ip.version == 4 and ip.is_global and 0 < int(port) <= 65535:
            return f"{ip}:{int(port)}"
    except (ValueError, TypeError):
        pass
    return None


def number(value):
    try:
        return max(0, int(value))
    except (ValueError, TypeError):
        return None


def normalize(provider, payload):
    rows = []
    if provider == "warmup":
        if payload.get("ok") is not True or payload.get("demo") or payload.get("stale"):
            raise ValueError("Provider data unavailable")
        for item in payload["cards"]:
            live = item.get("live") or {}
            rows.append(dict(address=item.get("ip"), name=" · ".join(item.get("lines", [])),
                mode=item.get("mode", "DM"), city=item.get("city", ""), country=item.get("code", ""),
                map=item.get("map", ""), players=live.get("server_current_users"), capacity=live.get("server_total_shown_slots"),
                bots=live.get("server_current_bots"), stale=live.get("freshness") != "fresh"))
    else:
        modules = payload["data"]["modules"]
        locations = {x["location"]: x for x in modules["servers_locations"]["data"]}
        # Game 2 is CS2. Game 1 is legacy CS:GO and must never be included.
        groups = modules["servers"]["data"]["servers"]["2"]
        for categories in groups.values():
            for servers in categories.values():
                for item in servers:
                    if item.get("id_games") != 2:
                        continue
                    loc = locations.get(item.get("location"), {})
                    rows.append(dict(address=f"{item.get('ip')}:{item.get('port')}",
                        name=f"{item.get('mode', '')} #{item.get('num', '')}", mode=item.get("mode", ""),
                        city=loc.get("city", item.get("location", "")), country=loc.get("country", ""),
                        map=item.get("map", ""), players=item.get("players"), capacity=item.get("maxplayers"), bots=None, stale=False))
    clean = {}
    for row in rows:
        addr = address(row["address"])
        if not addr:
            continue
        row.update(address=addr, id=f"{provider}:{addr}", provider=provider)
        for field in ("players", "capacity", "bots"):
            row[field] = number(row[field])
        for field in ("name", "mode", "city", "country", "map"):
            row[field] = str(row[field] or "")[:180]
        clean[addr] = row
    if not clean:
        raise ValueError("Empty directory")
    return list(clean.values())


async def refresh(client, key):
    try:
        response = await client.get(PROVIDERS[key][2])
        response.raise_for_status()
        rows = normalize(key, response.json())
        _cache[key] = {"servers": rows, "updatedAt": time.time(), "stale": False}
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        old = _cache.get(key, {})
        _cache[key] = {**old, "stale": True}


@router.get("/api/servers")
async def server_directory():
    global _checked
    async with _lock:
        if time.monotonic() - _checked > 90 or not _cache:
            async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
                await asyncio.gather(*(refresh(client, key) for key, info in PROVIDERS.items() if info[2]))
            _checked = time.monotonic()
    providers, servers = [], []
    for key, (name, url, endpoint) in PROVIDERS.items():
        cached = _cache.get(key, {})
        usable = time.time() - cached.get("updatedAt", 0) < 86400
        rows = cached.get("servers", []) if usable else []
        providers.append(dict(id=key, name=name, url=url, count=len(rows), updatedAt=cached.get("updatedAt"),
            status="directory" if not endpoint else "unavailable" if not rows else "stale" if cached.get("stale") else "updated"))
        servers.extend({**row, "stale": row["stale"] or cached.get("stale", True)} for row in rows)
    return {"providers": providers, "servers": servers}
