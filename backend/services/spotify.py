import os

import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
CALLBACK_URL = "https://swole-api.project-prometheus.online/admin/callback"
SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1"

class SpotifyService:
    def __init__(self):
        self.refresh_token = None
        self.access_token = None

    def spotify_get(self, endpoint: str, params: dict = None):
        response = requests.get(
            url=f"{SPOTIFY_API_BASE_URL}{endpoint}",
            headers={"Authorization": f"Bearer {self.access_token}"},
            params=params,
        )
        print(response.status_code)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            pass

    def spotify_post(self, endpoint: str, params: dict = None):
        response = requests.post(
            url=f"{SPOTIFY_API_BASE_URL}{endpoint}",
            headers={"Authorization": f"Bearer {self.access_token}"},
            params=params,
        )
        return response.status_code
        
    @staticmethod
    def get_authenticate_url():
        spotify_auth = f"https://accounts.spotify.com/authorize?client_id={CLIENT_ID}&response_type=code&redirect_uri={CALLBACK_URL}&scope=user-modify-playback-state%20user-read-playback-state"
        return spotify_auth
    
    def get_api_tokens(self, code: str):
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": CALLBACK_URL,
        }
        
        response = requests.post(
            url="https://accounts.spotify.com/api/token",
            auth=HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET),
            data=data
        )
        
        print(response)
        
        if response.status_code != 200:
            return False
        
        response_data = response.json()
        self.refresh_token = response_data["refresh_token"]
        self.access_token = response_data["access_token"]
        return True

    def search_songs(self, search: str):
        response = self.spotify_get("/search", params={"q": search, "type": "track"})
        
        songs = list()
        for track in response["tracks"]["items"]:
            songs.append({
                "id": track["id"],
                "name": track["name"],
                "artist": ", ".join(a["name"] for a in track["artists"]),
                "album": track["album"]["name"],
                "uri": track["uri"],
                "duration_ms": track["duration_ms"],
                "album_art": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
            })
            
        return songs

    def get_current_user(self):
        return self.spotify_get("/me")

    def get_current_playing(self):
        return self.spotify_get("/me/player/currently-playing")

    def get_current_queue(self):
        return self.spotify_get("/me/player/queue")
    
    def add_to_queue(self, song_uri: str):
        return self.spotify_post("/me/player/queue", params={"uri": song_uri})
