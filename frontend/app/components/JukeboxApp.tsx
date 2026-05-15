'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'
const WS_BASE = API_BASE.replace(/^http/, 'ws')

// ── Types ──────────────────────────────────────────────────────────────────

interface Artist {
  name: string
}

interface AlbumImage {
  url: string
}

interface Album {
  name: string
  images: AlbumImage[]
}

interface Track {
  name: string
  artists: Artist[]
  album: Album
  uri: string
  duration_ms: number
}

interface CurrentlyPlaying {
  item: Track
  progress_ms: number
  is_playing: boolean
}

interface SearchTrack {
  id: string
  name: string
  artist: string
  album: string
  uri: string
  duration_ms: number
  album_art: string | null
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Sub-components ─────────────────────────────────────────────────────────

function NowPlaying({
  track,
  onSongEnd,
}: {
  track: CurrentlyPlaying | null
  onSongEnd: () => void
}) {
  const [localProgress, setLocalProgress] = useState(track?.progress_ms ?? 0)
  const onSongEndRef = useRef(onSongEnd)
  onSongEndRef.current = onSongEnd

  // Sync local progress when a new song starts
  useEffect(() => {
    setLocalProgress(track?.progress_ms ?? 0)
  }, [track?.item?.uri, track?.progress_ms])

  // Tick every second while playing
  useEffect(() => {
    if (!track?.is_playing || !track?.item) return

    const interval = setInterval(() => {
      setLocalProgress(prev => {
        const next = prev + 1000
        if (next >= track.item.duration_ms) {
          clearInterval(interval)
          onSongEndRef.current()
          return track.item.duration_ms
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [track?.is_playing, track?.item?.uri, track?.item?.duration_ms])

  if (!track?.item) {
    return (
      <section className="rounded-2xl bg-zinc-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
          Now Playing
        </p>
        <p className="text-zinc-500 text-sm">Nothing playing right now.</p>
      </section>
    )
  }

  const { item } = track
  const art = item.album.images[0]?.url
  const pct = Math.min(100, (localProgress / item.duration_ms) * 100)

  return (
    <section className="rounded-2xl bg-zinc-900 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
        Now Playing
      </p>
      <div className="flex gap-4 items-center">
        {art ? (
          <Image
            src={art}
            alt={item.album.name}
            width={80}
            height={80}
            className="rounded-lg shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-zinc-800 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate text-lg">{item.name}</p>
          <p className="text-zinc-400 text-sm truncate">
            {item.artists.map(a => a.name).join(', ')} — {item.album.name}
          </p>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-zinc-700">
              <div
                className="h-1.5 rounded-full bg-green-500 transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>{formatMs(localProgress)}</span>
              <span>{formatMs(item.duration_ms)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function QueueList({ tracks }: { tracks: Track[] }) {
  const next5 = tracks.slice(0, 5)

  return (
    <section className="rounded-2xl bg-zinc-900 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
        Up Next
      </p>
      {next5.length === 0 ? (
        <p className="text-zinc-500 text-sm">Queue is empty.</p>
      ) : (
        <ol className="space-y-3">
          {next5.map((track, i) => {
            const art = track.album.images[0]?.url
            return (
              <li key={`${track.uri}-${i}`} className="flex items-center gap-3">
                <span className="text-zinc-600 text-sm w-4 text-right shrink-0">
                  {i + 1}
                </span>
                {art ? (
                  <Image
                    src={art}
                    alt={track.album.name}
                    width={40}
                    height={40}
                    className="rounded shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-zinc-800 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{track.name}</p>
                  <p className="text-zinc-400 text-xs truncate">
                    {track.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function SearchResult({
  track,
  onAdd,
  adding,
}: {
  track: SearchTrack
  onAdd: (uri: string) => void
  adding: boolean
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-800 transition-colors">
      {track.album_art ? (
        <Image
          src={track.album_art}
          alt={track.album}
          width={48}
          height={48}
          className="rounded shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-zinc-800 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{track.name}</p>
        <p className="text-zinc-400 text-xs truncate">
          {track.artist} — {track.album}
        </p>
      </div>
      <button
        onClick={() => onAdd(track.uri)}
        disabled={adding}
        className="shrink-0 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {adding ? '...' : '+ Add'}
      </button>
    </li>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function JukeboxApp() {
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([])
  const [searching, setSearching] = useState(false)
  const [addingUri, setAddingUri] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/juke/currently-playing`)
      if (!res.ok) return
      const data = await res.json()
      setNowPlaying(data.currently_playing)
    } catch {
      // silently ignore network errors during polling
    }
  }, [])

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/juke/queue`)
      if (!res.ok) return
      const data = await res.json()
      setQueue(data.queue?.queue ?? [])
    } catch {
      // silently ignore
    }
  }, [])

  // Initial load + polling every 15s
  useEffect(() => {
    fetchNowPlaying()
    fetchQueue()
    const interval = setInterval(() => {
      fetchNowPlaying()
      fetchQueue()
    }, 15_000)
    return () => clearInterval(interval)
  }, [fetchNowPlaying, fetchQueue])

  // WebSocket: re-fetch queue whenever any client adds a song
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/juke/ws`)
    ws.onmessage = (event) => {
      if (event.data === 'queue_updated') {
        fetchQueue()
      }
    }
    return () => ws.close()
  }, [fetchQueue])

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    debounceTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `${API_BASE}/juke/search?q=${encodeURIComponent(searchQuery.trim())}`
        )
        if (!res.ok) return
        const data = await res.json()
        setSearchResults(data.tracks ?? [])
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [searchQuery])

  const handleAdd = useCallback(
    async (uri: string) => {
      setAddingUri(uri)
      try {
        const res = await fetch(
          `${API_BASE}/juke/queue?song_uri=${encodeURIComponent(uri)}`,
          { method: 'POST' }
        )
        if (res.ok) {
          addToast('Added to queue!', 'success')
          await fetchQueue()
        } else {
          addToast('Failed to add song.', 'error')
        }
      } catch {
        addToast('Network error.', 'error')
      } finally {
        setAddingUri(null)
      }
    },
    [addToast, fetchQueue]
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight text-green-400">Jukebox</h1>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Now Playing */}
        <NowPlaying track={nowPlaying} onSongEnd={fetchNowPlaying} />

        {/* Search */}
        <section className="rounded-2xl bg-zinc-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
            Add a Song
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for a song..."
              className="flex-1 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-green-500"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                className="rounded-xl bg-zinc-800 px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {searching && (
            <p className="text-zinc-500 text-sm mt-4">Searching...</p>
          )}

          {!searching && searchResults.length > 0 && (
            <ul className="mt-4 space-y-1">
              {searchResults.map(track => (
                <SearchResult
                  key={track.id}
                  track={track}
                  onAdd={handleAdd}
                  adding={addingUri === track.uri}
                />
              ))}
            </ul>
          )}

          {!searching && searchQuery.trim() && searchResults.length === 0 && (
            <p className="text-zinc-500 text-sm mt-4">No results found.</p>
          )}
        </section>

        {/* Queue */}
        <QueueList tracks={queue} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-3 text-center">
        <a
          href="/admin"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Host login
        </a>
      </footer>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
