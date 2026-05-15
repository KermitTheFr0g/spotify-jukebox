# Spotify Jukebox — Frontend Brief

## Project overview

A jukebox web app backed by a FastAPI server that proxies the Spotify Web API. Users browse and search songs, then add them to the host's Spotify queue. The host authenticates once via `/admin/login`; after that the server holds the access token in memory.

## Base URL

```
https://jukebox.project-prometheus.online
```

(For local dev: `http://localhost:8000`)

---

## API endpoints

### GET `/`
Health check.

**Response**
```json
{ "message": "JukeBox is live!" }
```

---

### GET `/juke/currently-playing`
Returns the track currently playing on the host's Spotify.

**Response** — raw Spotify currently-playing object. Key fields:
```json
{
  "item": {
    "name": "Song Title",
    "artists": [{ "name": "Artist Name" }],
    "album": {
      "name": "Album Name",
      "images": [{ "url": "https://..." }]
    },
    "duration_ms": 210000
  },
  "progress_ms": 45000,
  "is_playing": true
}
```

---

### GET `/juke/search?q={query}`
Search Spotify for tracks. Returns a normalised list (server strips unnecessary fields).

**Query params**
| Param | Type   | Required | Description     |
|-------|--------|----------|-----------------|
| `q`   | string | yes      | Search query    |

**Response**
```json
{
  "tracks": [
    {
      "id": "4iV5W9uYEdYUVa79Axb7Rh",
      "name": "Song Title",
      "artist": "Artist One, Artist Two",
      "album": "Album Name",
      "uri": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      "duration_ms": 210000,
      "album_art": "https://i.scdn.co/image/..."
    }
  ]
}
```

---

### GET `/juke/queue`
Returns the current playback queue.

**Response** — raw Spotify queue object. Key field:
```json
{
  "queue": [
    {
      "name": "Song Title",
      "artists": [{ "name": "Artist Name" }],
      "album": { "name": "Album Name", "images": [{ "url": "https://..." }] },
      "uri": "spotify:track:..."
    }
  ]
}
```

---

### POST `/juke/queue?song_uri={uri}`
Adds a track to the host's Spotify queue.

**Query params**
| Param      | Type   | Required | Description                           |
|------------|--------|----------|---------------------------------------|
| `song_uri` | string | yes      | Full Spotify URI e.g. `spotify:track:4iV5W9uYEdYUVa79Axb7Rh` |

**Success response (200)**
```json
{ "message": "Song added to queue" }
```

**Error responses**
- `400` — no URI provided
- Any Spotify error status (403, 404, etc.) forwarded through

---

### GET `/admin/login`
Redirects the browser to the Spotify OAuth page. Used once by the host to authenticate.

---

## Suggested UI layout

```
┌─────────────────────────────────────────────────┐
│  🎵 Jukebox                                      │
├─────────────────────────────────────────────────┤
│  NOW PLAYING                                     │
│  [album art]  Song Title                        │
│               Artist — Album                    │
│               ████████░░░░░░  1:23 / 3:30       │
├─────────────────────────────────────────────────┤
│  [ Search for a song...             ] [Search]  │
│                                                 │
│  Results:                                       │
│  ┌─────────────────────────────────────────┐   │
│  │ [art] Song Title       Artist   [+ Add] │   │
│  │ [art] Song Title       Artist   [+ Add] │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  UP NEXT                                        │
│  1. Song Title — Artist                         │
│  2. Song Title — Artist                         │
└─────────────────────────────────────────────────┘
```

### Behaviour notes

- **Search**: debounce input by ~400ms, fire on Enter or button click. Don't fire for empty strings.
- **Now playing**: poll `GET /juke/currently-playing` every 10 seconds to refresh.
- **Queue**: refresh after every successful `POST /juke/queue` and on initial load.
- **Add to queue**: use the `uri` field from the search result (format `spotify:track:<id>`), not the `id`. Show a brief success/error toast after the POST.
- **Admin login**: a small discreet link/button somewhere (e.g. footer) that navigates to `/admin/login`. Once the host authenticates in Spotify, the server holds the token — users don't need to log in.

### Tech stack suggestion

Plain HTML/CSS/JS, React, or Vue all work. The API has no auth requirement for the jukebox routes — just hit the endpoints directly. No CORS config is visible in the current backend so confirm with the host or add `localhost` to the allowed origins if needed during development.

---

## Postman collection

See `postman_collection.json` in this directory.
