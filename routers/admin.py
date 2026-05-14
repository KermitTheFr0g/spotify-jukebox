from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from services.state import spotify_service

router = APIRouter(
    prefix="/admin"
)

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
    
    return {"message": "Successfully authenticated user"}
