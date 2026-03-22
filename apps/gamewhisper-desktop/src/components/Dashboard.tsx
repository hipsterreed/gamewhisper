import { useState, useEffect, useRef } from 'react'
import icon from '../assets/gamewhisper_icon_circle.png'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useHistory } from '../hooks/useHistory'
import { type FirestoreSession, type SessionMessage, type ToolCall } from '../stores/history.store'
import { SettingsContent } from './Settings'
import { useAuthStore } from '../stores/auth.store'

type View = 'session' | 'settings'

export function Dashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<View>('session')
  const { sessions, isLoading, hasMore, fetchError, fetchMore, deleteSession } = useHistory()
  const { user } = useAuthStore()
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Auto-select latest session when list first loads
  useEffect(() => {
    if (sessions.length > 0 && !selectedId) {
      setSelectedId(sessions[0].sessionId)
    }
  }, [sessions, selectedId])

  // Infinite scroll — trigger fetchMore when sentinel is visible
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) fetchMore() },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchMore])

  const selected = sessions.find((s) => s.sessionId === selectedId) ?? null

  function selectSession(id: string) {
    setSelectedId(id)
    setView('session')
  }

  async function handleDelete(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation()
    const idx = sessions.findIndex((s) => s.sessionId === sessionId)
    const ok = await deleteSession(sessionId)
    if (ok && selectedId === sessionId) {
      const next = sessions[idx + 1] ?? sessions[idx - 1] ?? null
      setSelectedId(next?.sessionId ?? null)
    }
  }

  return (
    <div
      className="flex h-full rounded-3xl overflow-hidden select-none"
      style={{ background: '#05050d' }}
    >
      {/* Left sidebar — always visible */}
      <div className="w-52 shrink-0 flex flex-col overflow-hidden">

        {/* Logo + app name — drag region */}
        <div data-tauri-drag-region className="flex items-center gap-3 px-4 pt-5 pb-4 shrink-0">
          <img src={icon} alt="GameWhisper" className="w-9 h-9 rounded-xl opacity-90 pointer-events-none" />
          <span className="text-base font-bold tracking-tight text-white/70 pointer-events-none">GameWhisper</span>
        </div>

        {/* Sessions label */}
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25">Sessions</p>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {fetchError && sessions.length === 0 && (
            <p className="px-4 py-2 text-xs text-red-400/70 leading-snug" title={fetchError}>
              Failed to load sessions
            </p>
          )}
          {!fetchError && sessions.length === 0 && !isLoading ? (
            <p className="px-4 py-2 text-xs text-white/20 italic leading-snug">
              Sessions will appear here after using the overlay
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.sessionId}
                className="group relative flex items-center px-2 py-0.5"
              >
                <div className={`absolute inset-x-2 inset-y-0.5 rounded-lg transition-colors pointer-events-none ${
                  selectedId === s.sessionId && view === 'session'
                    ? 'bg-white/[0.08]'
                    : 'group-hover:bg-white/[0.04]'
                }`} />
                <button
                  onClick={() => selectSession(s.sessionId)}
                  className="relative flex-1 text-left px-3 py-2 min-w-0"
                >
                  <p className="text-sm text-white/75 truncate">{s.topic || s.gameName || 'Unknown Game'}</p>
                  <p className="text-[11px] text-white/30 mt-0.5 truncate">
                    {s.topic ? (s.gameName || 'Unknown Game') + ' · ' : ''}{formatTime(s.startedAt)}
                  </p>
                </button>
                <button
                  onClick={(e) => handleDelete(e, s.sessionId)}
                  title="Delete session"
                  className="relative opacity-0 group-hover:opacity-100 shrink-0 mr-2 w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-red-400 hover:bg-red-500/15 transition-all"
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading spinner */}
          {isLoading && (
            <div className="flex justify-center py-3">
              <Spinner />
            </div>
          )}

          {/* End of list sentinel — no label */}
          {!isLoading && !hasMore && sessions.length > 0 && (
            <div className="h-2" />
          )}
        </div>

        {/* Bottom nav — settings + user profile */}
        <div className="shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Settings nav item */}
          <button
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 transition-colors ${
              view === 'settings'
                ? 'bg-white/[0.07] text-white/70'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
            }`}
          >
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <GearIcon />
            </div>
            <span className="text-sm font-medium">Settings</span>
          </button>

          {/* User profile */}
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                className="w-7 h-7 rounded-full shrink-0 opacity-80"
              />
            ) : (
              <div className="w-7 h-7 rounded-full shrink-0 bg-white/10 flex items-center justify-center">
                <span className="text-xs text-white/40">{user?.displayName?.[0] ?? '?'}</span>
              </div>
            )}
            <span className="text-sm text-white/50 truncate">{user?.displayName ?? user?.email ?? 'Account'}</span>
          </div>
        </div>
      </div>

      {/* Right content card — inset from top/right/bottom, flush to sidebar on left */}
      <div
        className="flex-1 flex flex-col mt-2 mr-2 mb-2 rounded-2xl overflow-hidden"
        style={{ background: '#0d0d1b' }}
      >
        {/* Card header */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between px-5 shrink-0"
          style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-sm font-medium text-white/50 pointer-events-none">
            {view === 'settings'
              ? 'Settings'
              : selected?.gameName ?? (sessions.length === 0 ? 'No sessions yet' : 'Select a session')}
          </p>
          <div className="flex gap-0.5">
            <button
              onClick={() => getCurrentWindow().minimize()}
              className="w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
                <rect width="10" height="1.5" rx="0.75" />
              </svg>
            </button>
            <button
              onClick={() => getCurrentWindow().hide()}
              className="w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-white hover:bg-red-500/70 transition-all"
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="8" y2="8" />
                <line x1="8" y1="1" x2="1" y2="8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Card content body */}
        <div className="flex-1 overflow-y-auto">
          {view === 'settings' ? (
            <div className="px-5 py-4">
              <SettingsContent />
            </div>
          ) : selected ? (
            <SessionDetail session={selected} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

type TimelineItem =
  | { kind: 'message'; data: SessionMessage; time: number }
  | { kind: 'toolcall'; data: ToolCall; time: number }

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function SourceCard({ url }: { url: string }) {
  const ytId = getYouTubeId(url)
  const isImage = isImageUrl(url)

  if (ytId) {
    return (
      <button
        onClick={() => openUrl(url)}
        title={url}
        className="relative shrink-0 w-32 rounded-lg overflow-hidden border border-white/10 hover:border-white/25 transition-all group"
      >
        <img
          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
          alt="YouTube"
          className="w-full h-18 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          style={{ height: 72 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
              <polygon points="3,1 9,5 3,9" />
            </svg>
          </div>
        </div>
        <p className="px-1.5 py-1 text-[10px] text-white/40 truncate bg-black/30">youtube.com</p>
      </button>
    )
  }

  if (isImage) {
    return (
      <button
        onClick={() => openUrl(url)}
        title={url}
        className="shrink-0 w-32 rounded-lg overflow-hidden border border-white/10 hover:border-white/25 transition-all"
      >
        <img
          src={url}
          alt={getDomain(url)}
          className="w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
          style={{ height: 72 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
        <p className="px-1.5 py-1 text-[10px] text-white/40 truncate">{getDomain(url)}</p>
      </button>
    )
  }

  return (
    <button
      onClick={() => openUrl(url)}
      title={url}
      className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/08 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition-all max-w-[160px]"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-white/30">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <span className="text-[10px] text-white/40 truncate">{getDomain(url)}</span>
    </button>
  )
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 border-l-2 flex flex-col gap-2"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeftColor: 'rgba(99,102,241,0.4)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400/60 shrink-0">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="text-[11px] text-white/35">Searched: </span>
        <span className="text-[11px] text-white/55 italic truncate">"{toolCall.query}"</span>
      </div>
      {toolCall.sources.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {toolCall.sources.map((url) => (
            <SourceCard key={url} url={url} />
          ))}
        </div>
      )}
    </div>
  )
}

function SessionDetail({ session }: { session: FirestoreSession }) {
  const timeline: TimelineItem[] = [
    ...session.messages.map((m) => ({ kind: 'message' as const, data: m, time: m.timestamp })),
    ...session.toolCalls.map((tc) => ({ kind: 'toolcall' as const, data: tc, time: tc.recordedAt })),
  ].sort((a, b) => a.time - b.time)

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <p className="text-xs text-white/25">{new Date(session.startedAt).toLocaleString()}</p>

      {timeline.length === 0 ? (
        <p className="text-sm text-white/25 italic">No messages recorded</p>
      ) : (
        timeline.map((item, i) => {
          if (item.kind === 'toolcall') {
            return <ToolCallCard key={`tc-${i}`} toolCall={item.data} />
          }
          const msg = item.data
          return (
            <div key={`msg-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-sm px-3.5 py-2 rounded-2xl text-sm leading-snug ${
                  msg.role === 'user'
                    ? 'bg-blue-500/25 text-blue-100 rounded-br-md'
                    : 'bg-white/[0.07] text-white/75 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 select-none" style={{ paddingBottom: 40 }}>
      <p className="text-white/20 text-sm">No session selected</p>
      <p className="text-white/12 text-xs">Start the overlay with your hotkey to begin</p>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function formatTime(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
