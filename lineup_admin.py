"""Owner-only draft editing. Video bytes and drafts share the persistent account DB."""
import asyncio
import json
import os
import re
import uuid
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ConfigDict
from typing import Literal
from account_store import connection, db_cursor, DATABASE_URL, get_user_for_session, persistent_storage_configured

router = APIRouter()
ROOT = Path(__file__).parent
OWNER_STEAM = "76561199158267709"  # User-provided steamcommunity.com/id/CL0NEEE profile.
MAX_VIDEO = 32 * 1024 * 1024


def query(sql, params=(), one=False):
    with connection() as db, db_cursor(db) as cur:
        cur.execute(sql.replace("?", "%s") if DATABASE_URL else sql, params)
        if cur.description:
            return dict(cur.fetchone()) if one else [dict(r) for r in cur.fetchall()]


def init_lineups():
    binary = "BYTEA" if DATABASE_URL else "BLOB"
    with connection() as db, db_cursor(db) as cur:
        cur.execute("CREATE TABLE IF NOT EXISTS lineup_edits (id TEXT PRIMARY KEY, draft TEXT NOT NULL, published TEXT)")
        cur.execute(f"CREATE TABLE IF NOT EXISTS lineup_videos (id TEXT PRIMARY KEY, mime TEXT NOT NULL, body {binary} NOT NULL)")


async def require_admin(request, mutation=False):
    if os.getenv("LINEUP_ADMIN_ENABLED", "true").lower() != "true":
        raise HTTPException(403, "Lineup düzenleme kapalı.")
    user = await asyncio.to_thread(get_user_for_session, request.cookies.get("cs2coach_session"))
    allowed = {v.strip() for v in os.getenv("LINEUP_ADMIN_STEAM_IDS", OWNER_STEAM).split(",") if v.strip()}
    if not user or user.get("steam_id") not in allowed:
        raise HTTPException(403, "Bu bölüm yalnızca yöneticiye açık. Yönetici Steam hesabınla giriş yap.")
    if mutation:
        if request.headers.get("x-lineup-editor") != "1":
            raise HTTPException(403, "Düzenleyici isteği gerekli.")
        origin = request.headers.get("origin")
        public = os.getenv("PUBLIC_BASE_URL", str(request.base_url)).rstrip("/")
        if origin and urlsplit(origin).netloc != urlsplit(public).netloc:
            raise HTTPException(403, "Geçersiz istek kaynağı.")
        if not persistent_storage_configured():
            raise HTTPException(503, "Kalıcı veritabanı ayarlanmadan video veya taslak kaydedilemez.")
    return user


class Edit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,100}$")
    map: Literal['ancient','anubis','cache','dust2','inferno','mirage','nuke','overpass','train','vertigo']
    title: str = Field(min_length=1, max_length=180)
    type: Literal['smoke','flash','molotov','he']
    team: Literal['T','CT']
    x: float = Field(ge=0, le=100, allow_inf_nan=False)
    y: float = Field(ge=0, le=100, allow_inf_nan=False)
    tx: float = Field(ge=0, le=100, allow_inf_nan=False)
    ty: float = Field(ge=0, le=100, allow_inf_nan=False)
    startFloor: Literal['upper','lower'] = 'upper'
    targetFloor: Literal['upper','lower'] = 'upper'
    from_: str = Field(default='', alias='from', max_length=2000)
    aim: str = Field(default='', max_length=2000)
    throwType: str = Field(default='', max_length=2000)
    video: str = Field(default='', pattern=r"^(|/api/lineup-videos/[a-f0-9]{32})$")
    hidden: bool = False


@router.get('/api/lineup-admin/access')
async def access(request: Request):
    try:
        await require_admin(request)
        return {'admin': True, 'persistent': persistent_storage_configured(), 'maxVideoBytes': MAX_VIDEO}
    except HTTPException:
        return {'admin': False}


@router.get('/admin/lineups')
async def editor_page(request: Request):
    await require_admin(request)
    return FileResponse(ROOT / 'static/lineup-admin.html', headers={'Cache-Control':'no-store'})


@router.get('/api/lineup-admin/drafts')
async def drafts(request: Request):
    await require_admin(request)
    rows = await asyncio.to_thread(query, 'SELECT draft, published FROM lineup_edits')
    return {'items': [dict(json.loads(r['draft']), published=bool(r['published'])) for r in rows]}


@router.put('/api/lineup-admin/drafts/{item_id}')
async def save_draft(item_id: str, item: Edit, request: Request):
    await require_admin(request, True)
    if item_id != item.id:
        raise HTTPException(400, 'Kayıt kimliği uyuşmuyor.')
    if item.video:
        videos = await asyncio.to_thread(query, 'SELECT id FROM lineup_videos WHERE id=?', (item.video.rsplit('/',1)[1],))
        if not videos:
            raise HTTPException(400, 'Video bulunamadı.')
    data = item.model_dump(by_alias=True)
    data.update(author='CLONE LAB', source='CLONE LAB', coordinateSpace='manual')
    await asyncio.to_thread(query, 'INSERT INTO lineup_edits(id,draft) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET draft=excluded.draft', (item_id,json.dumps(data)))
    return {'saved': True}


@router.post('/api/lineup-admin/publish/{item_id}')
async def publish(item_id: str, request: Request):
    await require_admin(request, True)
    rows = await asyncio.to_thread(query, 'SELECT draft FROM lineup_edits WHERE id=?', (item_id,))
    if not rows:
        raise HTTPException(404, 'Taslak bulunamadı.')
    await asyncio.to_thread(query, 'UPDATE lineup_edits SET published=draft WHERE id=?', (item_id,))
    return {'published': True}


@router.get('/api/lineups/overrides')
async def published():
    rows = await asyncio.to_thread(query, 'SELECT published FROM lineup_edits WHERE published IS NOT NULL')
    return {'items': [json.loads(r['published']) for r in rows]}


@router.post('/api/lineup-admin/video')
async def upload(request: Request):
    await require_admin(request, True)
    mime = request.headers.get('content-type','').split(';')[0]
    if mime not in ('video/mp4','video/webm'):
        raise HTTPException(415, 'MP4 veya WebM seç.')
    buf = bytearray()
    async for chunk in request.stream():
        if len(buf)+len(chunk)>MAX_VIDEO:
            raise HTTPException(413, 'Video en fazla 32 MB olabilir.')
        buf.extend(chunk)
    if not ((mime=='video/mp4' and buf[4:8]==b'ftyp') or (mime=='video/webm' and buf[:4]==b'\x1aE\xdf\xa3')):
        raise HTTPException(415, 'Geçerli video dosyası gerekli.')
    identifier = uuid.uuid4().hex
    await asyncio.to_thread(query,'INSERT INTO lineup_videos(id,mime,body) VALUES (?,?,?)',(identifier,mime,bytes(buf)))
    return {'url':'/api/lineup-videos/'+identifier}


@router.get('/api/lineup-videos/{identifier}')
async def video(identifier: str, request: Request):
    if not re.fullmatch('[a-f0-9]{32}',identifier):
        raise HTTPException(404)
    edits = await asyncio.to_thread(query,'SELECT published FROM lineup_edits WHERE published IS NOT NULL')
    path = '/api/lineup-videos/'+identifier
    if not any(json.loads(r['published']).get('video')==path and not json.loads(r['published']).get('hidden') for r in edits):
        await require_admin(request)
    rows = await asyncio.to_thread(query,'SELECT mime,body FROM lineup_videos WHERE id=?',(identifier,))
    if not rows:
        raise HTTPException(404)
    body=bytes(rows[0]['body']); size=len(body); start=0; end=size-1; status=200
    headers={'Accept-Ranges':'bytes','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}
    requested=request.headers.get('range')
    if requested:
        match=re.fullmatch(r'bytes=(\d*)-(\d*)',requested)
        if not match or not any(match.groups()):
            return Response(status_code=416,headers={'Content-Range':f'bytes */{size}'})
        a,b=match.groups()
        if a: start=int(a); end=min(int(b),end) if b else end
        else: start=max(0,size-int(b))
        if start>end or start>=size:
            return Response(status_code=416,headers={'Content-Range':f'bytes */{size}'})
        status=206;headers['Content-Range']=f'bytes {start}-{end}/{size}'
    return Response(body[start:end+1],status_code=status,media_type=rows[0]['mime'],headers=headers)
