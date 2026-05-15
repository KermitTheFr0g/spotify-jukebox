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
async def add_to_queue(song_uri: str):
    if not song_uri:
        raise HTTPException(status_code=400, detail="No song URI provided")
    status_code = spotify_service.add_to_queue(song_uri)
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail="Failed to add song to queue")
    return {"message": "Song added to queue"}

