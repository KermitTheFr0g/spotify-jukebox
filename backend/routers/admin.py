import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from services.state import spotify_service

router = APIRouter(
    prefix="/admin"
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

@router.get("/login")
async def admin_login():
    spotify_auth = spotify_service.get_authenticate_url()
    return RedirectResponse(url=spotify_auth)

@router.get("/callback")
async def admin_callback(code: str):
    if code is None:
        raise HTTPException(status_code=400, detail="No code received")
    if not spotify_service.get_api_tokens(code):
        raise HTTPException(status_code=500, detail="Failed to auth user")
    return RedirectResponse(url=f"{FRONTEND_URL}/admin")

@router.get("/me")
async def admin_me():
    if not spotify_service.access_token:
        return {"connected": False}
    user = spotify_service.get_current_user()
    if not user:
        return {"connected": False}
    return {
        "connected": True,
        "name": user.get("display_name"),
        "email": user.get("email"),
        "image": user.get("images", [{}])[0].get("url") if user.get("images") else None,
        "profile_url": user.get("external_urls", {}).get("spotify"),
    }
