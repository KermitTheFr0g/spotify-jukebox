from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from services.state import spotify_service

router = APIRouter(
    prefix="/juke"
)

@router.get("/currently-playing")
async def currently_playing():
    currently_playing = spotify_service.get_current_playing()
    return {"currently_playing": currently_playing}

@router.get("/search")
async def search(q: str):
    if not q:
        return {"message": "nothing there"}
    songs = spotify_service.search_songs(q)
    return {"tracks": songs}

@router.get("/queue")
async def view_queue():
    current_queue = spotify_service.get_current_queue()
    return {"queue": current_queue}

@router.post("/queue")
async def add_to_queue(song_id: str):
    if not song_id:
        return 400, {"error", "No song ID passed"}
