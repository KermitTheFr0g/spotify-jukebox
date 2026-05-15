'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'

interface AdminStatus {
  connected: boolean
  name?: string
  email?: string
  image?: string
  profile_url?: string
}

export default function AdminPage() {
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/admin/me`)
      .then(r => r.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm">
          ← Back
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-green-400">Admin</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-8">
          {loading ? (
            <p className="text-zinc-500 text-sm text-center">Checking connection...</p>
          ) : status?.connected ? (
            <Connected status={status} />
          ) : (
            <NotConnected />
          )}
        </div>
      </main>
    </div>
  )
}

function Connected({ status }: { status: AdminStatus }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {status.image ? (
        <Image
          src={status.image}
          alt={status.name ?? 'User'}
          width={80}
          height={80}
          className="rounded-full"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-2xl">
          🎵
        </div>
      )}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-1">
          Connected
        </p>
        <p className="text-white font-semibold text-lg">{status.name}</p>
        {status.email && (
          <p className="text-zinc-400 text-sm">{status.email}</p>
        )}
      </div>
      {status.profile_url && (
        <a
          href={status.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          View Spotify profile ↗
        </a>
      )}
    </div>
  )
}

function NotConnected() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-3xl">
        🔒
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
          Not Connected
        </p>
        <p className="text-zinc-400 text-sm">
          No Spotify account linked. Log in to start the jukebox.
        </p>
      </div>
      <a
        href={`${API_BASE}/admin/login`}
        className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-500 transition-colors text-center"
      >
        Login with Spotify
      </a>
    </div>
  )
}
