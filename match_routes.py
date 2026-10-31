import asyncio
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from account_store import get_user_for_session
from match_tracking import connect_tracking, disconnect_tracking, tracking_status, cipher

router = APIRouter(prefix="/api/cs2")


class ConnectBody(BaseModel):
    auth_code: str = Field(min_length=1, max_length=32)
    share_code: str = Field(min_length=1, max_length=64)


async def account(request):
    user = await asyncio.to_thread(get_user_for_session, request.cookies.get("cs2coach_session"))
    if not user:
        raise HTTPException(401, "Önce giriş yap.")
    if not user.get("steam_id"):
        raise HTTPException(409, "Önce Steam hesabını bağla.")
    return user


@router.get("/tracking")
async def status(request: Request):
    user = await account(request)
    return await asyncio.to_thread(tracking_status, user["user_id"], user["steam_id"])


@router.post("/tracking")
async def connect(body: ConnectBody, request: Request):
    user = await account(request)
    try:
        cipher()
    except Exception:
        raise HTTPException(503, "Otomatik maç takibi sunucu kurulumu henüz tamamlanmadı.")
    try:
        await asyncio.to_thread(connect_tracking, user["user_id"], user["steam_id"], body.auth_code.strip(), body.share_code.strip())
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return await asyncio.to_thread(tracking_status, user["user_id"], user["steam_id"])


@router.delete("/tracking")
async def disconnect(request: Request):
    user = await account(request)
    await asyncio.to_thread(disconnect_tracking, user["user_id"])
    return {"disconnected": True}
