from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from services.state import spotify_service

router = APIRouter(
    prefix="/juke"
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


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
    await manager.broadcast("queue_updated")
    return {"message": "Song added to queue"}
