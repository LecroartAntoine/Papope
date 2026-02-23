'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DayPlan } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patch {
  skip?: string[]
  modify?: Record<string, { sets?: string; reps?: string; note?: string }>
  session_note?: string
  convert_to_recovery?: boolean
}

interface ChatMessage {
  id: number
  role: 'user' | 'coach'
  content: string
  patch?: Patch | null
  created_at?: string
}

interface Props {
  dateKey: string
  dayPlan: DayPlan | undefined
  currentExercises: Record<string, boolean>
  onApplyPatch: (patch: Patch) => void
}

// ─── Patch preview badge ──────────────────────────────────────────────────────

function PatchBadge({ patch, onApply, applied }: {
  patch: Patch
  onApply: () => void
  applied: boolean
}) {
  const skipCount = patch.skip?.length ?? 0
  const modifyCount = Object.keys(patch.modify ?? {}).length

  if (skipCount === 0 && modifyCount === 0 && !patch.convert_to_recovery) return null

  return (
    <div className={`mt-2 border rounded p-2.5 text-xs font-mono transition-all ${
      applied
        ? 'border-accent border-opacity-40 bg-accent bg-opacity-5'
        : 'border-info border-opacity-40 bg-info bg-opacity-5'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="text-info uppercase tracking-wider text-xs">
          {applied ? '✓ Adaptation appliquée' : '⚡ Adaptation proposée'}
        </div>
        {!applied && (
          <button
            onClick={onApply}
            className="bg-accent text-carbon text-xs font-bold px-3 py-1 uppercase tracking-wider hover:bg-opacity-90 transition-all flex-shrink-0"
          >
            Appliquer
          </button>
        )}
      </div>
      {patch.convert_to_recovery && (
        <div className="text-warn">→ Séance convertie en récupération</div>
      )}
      {skipCount > 0 && (
        <div className="text-crit">→ {skipCount} exercice{skipCount > 1 ? 's' : ''} supprimé{skipCount > 1 ? 's' : ''}</div>
      )}
      {modifyCount > 0 && (
        <div className="text-warn">→ {modifyCount} exercice{modifyCount > 1 ? 's' : ''} allégé{modifyCount > 1 ? 's' : ''}</div>
      )}
      {patch.session_note && (
        <div className="text-ghost mt-1 italic">"{patch.session_note}"</div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CoachChat({ dateKey, dayPlan, currentExercises, onApplyPatch }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [appliedPatches, setAppliedPatches] = useState<Set<number>>(new Set())
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Load chat history for this date
  useEffect(() => {
    setMessages([])
    setHistoryLoaded(false)
    setAppliedPatches(new Set())

    fetch(`/api/coach?date=${dateKey}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data)
          if (data.length > 0 && !open) setHasUnread(true)
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true))
  }, [dateKey])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    // Optimistic UI — add user message immediately
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: userMsg,
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          message: userMsg,
          dayPlan: dayPlan ? {
            title: dayPlan.title,
            type: dayPlan.type,
            sections: dayPlan.sections,
          } : null,
          currentExercises,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const coachMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'coach',
        content: data.message,
        patch: data.patch ?? null,
      }
      setMessages(prev => [...prev, coachMsg])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'coach',
        content: `Erreur : ${err.message}. Vérifie que GEMINI_API_KEY est configurée.`,
      }])
    }

    setLoading(false)
  }, [input, loading, dateKey, dayPlan, currentExercises])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const applyPatch = useCallback((msgId: number, patch: Patch) => {
    onApplyPatch(patch)
    setAppliedPatches(prev => new Set([...prev, msgId]))
  }, [onApplyPatch])

  const quickMessages = [
    'Je ne me sens pas bien aujourd\'hui',
    'Mes bras me font mal',
    'Je suis très fatigué',
    'Séance rapide, j\'ai peu de temps',
    'Je me sens en forme !',
  ]

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent text-carbon rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all active:scale-95"
        title="Coach IA"
      >
        <span className="text-2xl">🤖</span>
        {hasUnread && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-crit rounded-full border-2 border-carbon" />
        )}
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-carbon bg-opacity-60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Chat panel ── */}
      <div
        ref={panelRef}
        className={`fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:bottom-6 sm:right-6 bg-carbon border border-steel flex flex-col transition-all duration-300 ${
          open ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0 pointer-events-none'
        }`}
        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-steel flex items-center justify-between flex-shrink-0 bg-slate">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-base flex-shrink-0">
              🤖
            </div>
            <div>
              <div className="text-chalk text-sm font-mono font-bold leading-tight">Coach IA</div>
              <div className="text-ash text-xs font-mono leading-tight">
                {dayPlan ? dayPlan.title : 'Séance du jour'} · {dateKey}
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-ash hover:text-chalk transition-colors text-lg w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome message if empty */}
          {historyLoaded && messages.length === 0 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-3">💪</div>
              <div className="text-chalk text-sm font-mono mb-1">Prêt à adapter ta séance</div>
              <div className="text-ash text-xs font-mono">
                Dis-moi comment tu te sens, je m'occupe du reste.
              </div>
            </div>
          )}

          {/* Loading history */}
          {!historyLoaded && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className="h-12 w-48 bg-steel animate-pulse rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div
              key={msg.id ?? idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Role label */}
                <div className={`text-xs font-mono mb-1 ${msg.role === 'user' ? 'text-right text-ash' : 'text-left text-accent'}`}>
                  {msg.role === 'user' ? 'Toi' : '🤖 Coach'}
                </div>

                {/* Bubble */}
                <div className={`px-3 py-2.5 text-sm font-mono leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent text-carbon'
                    : 'bg-slate border border-steel text-chalk'
                }`}>
                  {msg.content}
                </div>

                {/* Patch badge */}
                {msg.patch && (msg.patch.skip?.length || Object.keys(msg.patch.modify ?? {}).length || msg.patch.convert_to_recovery) && (
                  <PatchBadge
                    patch={msg.patch}
                    applied={appliedPatches.has(msg.id)}
                    onApply={() => applyPatch(msg.id, msg.patch!)}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate border border-steel px-4 py-3 flex items-center gap-1.5">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-ash rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions — shown when chat is empty */}
        {historyLoaded && messages.length === 0 && !loading && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="text-xs text-ash font-mono mb-2 uppercase tracking-wider">Suggestions rapides</div>
            <div className="flex flex-wrap gap-1.5">
              {quickMessages.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                  className="text-xs font-mono text-ghost border border-zinc px-2 py-1 hover:border-accent hover:text-accent transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-steel flex-shrink-0 bg-slate">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Comment tu te sens ? (Entrée pour envoyer)"
              disabled={loading}
              rows={2}
              className="flex-1 bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 resize-none focus:outline-none focus:border-accent transition-colors placeholder-zinc disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-accent text-carbon w-10 h-10 flex items-center justify-center flex-shrink-0 hover:bg-opacity-90 transition-all disabled:opacity-40 text-lg"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin" />
              ) : '↑'}
            </button>
          </div>
          <div className="text-zinc text-xs font-mono mt-1.5 text-center">
            Gemini 2.5 Flash · Historique sauvegardé
          </div>
        </div>
      </div>
    </>
  )
}
