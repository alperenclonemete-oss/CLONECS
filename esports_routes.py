"""PandaScore proxy. Token stays server-side; fixed paths, bounded cache and budget."""
import asyncio
import os
import time
from collections import OrderedDict, deque
from typing import Literal
import httpx
from fastapi import APIRouter, Query

router = APIRouter(prefix='/api/esports')
_cache = OrderedDict()
_calls = deque()
_lock = asyncio.Lock()
_cooldown = 0
MESSAGES = {'setup': 'E-spor veri bağlantısı henüz etkinleştirilmedi.', 'auth': 'Veri sağlayıcı bağlantısı doğrulanamadı.', 'plan': 'Bu veri mevcut sağlayıcı planında kullanılamıyor.', 'limit': 'Veri sağlayıcı kotası doldu. Biraz sonra tekrar deneyin.', 'unavailable': 'Veri sağlayıcıya şu anda ulaşılamıyor.'}

async def provider(path, page=1, ttl=300):
    global _cooldown
    token = os.getenv('PANDASCORE_TOKEN', '').strip()
    if not token:
        return {'status': 'setup', 'message': MESSAGES['setup'], 'data': [], 'source': 'PandaScore'}
    key = (path, page)
    async with _lock:
        now = time.time()
        old = _cache.get(key)
        if old and now < old['expires']:
            _cache.move_to_end(key)
            return old['value']
        while _calls and _calls[0] < now - 3600:
            _calls.popleft()
        status = 'limit' if now < _cooldown or len(_calls) >= 200 else None
        if not status:
            _calls.append(now)
            try:
                async with httpx.AsyncClient(timeout=12, follow_redirects=False) as client:
                    response = await client.get('https://api.pandascore.co' + path, params={'page': page, 'per_page': 50}, headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/json'})
                if response.status_code == 200:
                    data = response.json()
                    if not isinstance(data, (list, dict)):
                        raise ValueError('Invalid payload')
                    value = {'status': 'ok', 'source': 'PandaScore', 'updated_at': int(now), 'page': page, 'has_more': isinstance(data, list) and len(data) == 50, 'data': data}
                    _cache[key] = {'expires': now + ttl, 'value': value}
                    while len(_cache) > 150:
                        _cache.popitem(last=False)
                    return value
                status = {401: 'auth', 403: 'plan', 429: 'limit'}.get(response.status_code, 'unavailable')
                if response.status_code == 429:
                    _cooldown = now + 60
            except (httpx.HTTPError, ValueError):
                status = 'unavailable'
        # Keep prior data visible with its original timestamp, never relabel stale scores live.
        value = dict(old['value']) if old and old['value'].get('updated_at') else {'data': [], 'source': 'PandaScore'}
        value.update(status=status, message=MESSAGES[status], stale=bool(value.get('updated_at')))
        _cache[key] = {'expires': now + 60, 'value': value}
        while len(_cache) > 150:
            _cache.popitem(last=False)
        return value

@router.get('/matches/{state}')
async def matches(state: Literal['running','upcoming','past'], page: int = Query(1, ge=1, le=20)):
    return await provider('/csgo/matches/' + state, page, 60 if state == 'running' else 300)

@router.get('/tournaments/{state}')
async def tournaments(state: Literal['running','upcoming','past'], page: int = Query(1, ge=1, le=20)):
    return await provider('/csgo/tournaments/' + state, page)

@router.get('/tournament/{item_id}/{section}')
async def tournament(item_id: int, section: Literal['brackets','rosters','standings','matches'], page: int = Query(1, ge=1, le=20)):
    if item_id < 1: return {'status':'unavailable','data':[],'message':MESSAGES['unavailable']}
    return await provider(f'/tournaments/{item_id}/{section}', page)

@router.get('/match/{item_id}/{section}')
async def match(item_id: int, section: Literal['details','games','stats']):
    if item_id < 1: return {'status':'unavailable','data':[],'message':MESSAGES['unavailable']}
    path = f'/matches/{item_id}' if section == 'details' else f'/csgo/matches/{item_id}/' + ('players/stats' if section == 'stats' else 'games')
    return await provider(path, ttl=120)

@router.get('/team/{item_id}')
async def team(item_id: int):
    if item_id < 1: return {'status':'unavailable','data':[],'message':MESSAGES['unavailable']}
    return await provider(f'/teams/{item_id}', ttl=3600)
