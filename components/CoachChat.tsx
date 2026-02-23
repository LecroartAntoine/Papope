'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DayItem, CustomDayPlan } from '@/types'

interface Patch {
  skip?: string[]
  modify?: Record<string, { sets?: string; reps?: string; note?: string }>
  session_note?: string
}

interface ChatMessage {
  id: number
  role: 'user' | 'coach'
  content: string
  patch?: Patch | null
  generatedDay?: CustomDayPlan | null
}

interface Props {
  dateKey: string
  currentDayPlan: { title: string; type: string } | undefined
  currentItems: DayItem[]
  onApplyPatch: (patch: Patch) => void
  onApplyGeneratedDay: (day: CustomDayPlan) => void
}

// ─── Patch badge ──────────────────────────────────────────────────────────────

function ActionBadge({ msg, applied, onApply }: {
  msg: ChatMessage
  applied: boolean
  onApply: () => void
}) {
  const hasPatch = msg.patch && (msg.patch.skip?.length || Object.keys(msg.patch.modify ?? {}).length)
  const hasDay = !!msg.generatedDay

  if (!hasPatch && !hasDay) return null

  return (
    <div className={`mt-2 border p-2.5 text-xs font-mono transition-all ${
      applied
        ? 'border-accent border-opacity-40 bg-accent bg-opacity-5'
        : 'border-info border-opacity-40 bg-info bg-opacity-5'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`uppercase tracking-wider ${applied ? 'text-accent' : 'text-info'}`}>
          {applied
            ? '✓ Appliqué'
            : hasDay ? '🤖 Nouvelle séance générée' : '⚡ Adaptation proposée'}
        </span>
        {!applied && (
          <button onClick={onApply} className="bg-accent text-carbon text-xs font-bold px-3 py-1 uppercase tracking-wider hover:bg-opacity-90 transition-all flex-shrink-0">
            Appliquer
          </button>
        )}
      </div>

      {hasDay && msg.generatedDay && (
        <div className="text-chalk">
          <span className="mr-1">{msg.generatedDay.emoji}</span>
          {msg.generatedDay.title} · {msg.generatedDay.items?.length ?? 0} items
        </div>
      )}
      {hasPatch && msg.patch && (
        <>
          {(msg.patch.skip?.length ?? 0) > 0 && <div className="text-crit">→ {msg.patch.skip!.length} exercice{msg.patch.skip!.length > 1 ? 's' : ''} supprimé{msg.patch.skip!.length > 1 ? 's' : ''}</div>}
          {Object.keys(msg.patch.modify ?? {}).length > 0 && <div className="text-warn">→ {Object.keys(msg.patch.modify!).length} exercice{Object.keys(msg.patch.modify!).length > 1 ? 's' : ''} allégé{Object.keys(msg.patch.modify!).length > 1 ? 's' : ''}</div>}
          {msg.patch.session_note && <div className="text-ghost italic mt-1">"{msg.patch.session_note}"</div>}
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CoachChat({ dateKey, currentDayPlan, currentItems, onApplyPatch, onApplyGeneratedDay }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set())
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMessages([])
    setHistoryLoaded(false)
    setAppliedIds(new Set())
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

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) { setHasUnread(false); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [open])

  const send = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userMsg }])

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          message: userMsg,
          currentDayPlan: currentDayPlan ?? null,
          currentItems: currentItems.map(i => ({ id: i.id, type: i.type, ...(i as any) })),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'coach',
        content: data.message,
        patch: data.patch ?? null,
        generatedDay: data.generatedDay ?? null,
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'coach', content: `Erreur : ${err.message}` }])
    }
    setLoading(false)
  }, [input, loading, dateKey, currentDayPlan, currentItems])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const applyMessage = useCallback((msg: ChatMessage) => {
    if (msg.generatedDay) {
      onApplyGeneratedDay(msg.generatedDay)
    } else if (msg.patch) {
      onApplyPatch(msg.patch)
    }
    setAppliedIds(prev => new Set([...prev, msg.id]))
  }, [onApplyPatch, onApplyGeneratedDay])

  const quickMessages = [
    "Je ne me sens pas bien aujourd'hui",
    'Mes bras me font mal',
    'Je suis très fatigué',
    'Génère-moi une séance jambes',
    'Je veux faire une rando',
    'Séance cardio plutôt',
    'Je me sens en forme !',
    'Séance courte, 20 min max',
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent text-carbon rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all active:scale-95"
        title="Coach IA"
      >
        <span className="text-2xl">🤖</span>
        {hasUnread && <span className="absolute top-0 right-0 w-4 h-4 bg-crit rounded-full border-2 border-carbon" />}
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-carbon bg-opacity-60 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Chat panel */}
      <div className={`fixed bottom-0 right-0 z-50 w-full sm:w-[440px] h-[88vh] sm:h-[640px] sm:bottom-6 sm:right-6 bg-carbon border border-steel flex flex-col transition-all duration-300 ${open ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0 pointer-events-none'}`}
        style={{ boxShadow: '0 0 60px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="px-4 py-3 border-b border-steel flex items-center justify-between flex-shrink-0 bg-slate">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center text-lg flex-shrink-0">🤖</div>
            <div>
              <div className="text-chalk text-sm font-mono font-bold">Coach IA</div>
              <div className="text-ash text-xs font-mono">{currentDayPlan?.title ?? 'Séance du jour'} · Gemini 2.5 Flash</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-ash hover:text-chalk text-lg w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {historyLoaded && messages.length === 0 && (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">💪</div>
              <div className="text-chalk text-sm font-mono mb-1">Prêt à adapter ou créer ta séance</div>
              <div className="text-ash text-xs font-mono">Dis-moi ce que tu veux faire aujourd'hui.</div>
            </div>
          )}

          {!historyLoaded && (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className={`flex ${i%2===0?'justify-start':'justify-end'}`}><div className="h-12 w-48 bg-steel animate-pulse rounded" /></div>)}
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={msg.id ?? idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`text-xs font-mono mb-1 ${msg.role === 'user' ? 'text-ash text-right' : 'text-accent'}`}>
                  {msg.role === 'user' ? 'Toi' : '🤖 Coach'}
                </div>
                <div className={`px-3 py-2.5 text-sm font-mono leading-relaxed ${msg.role === 'user' ? 'bg-accent text-carbon' : 'bg-slate border border-steel text-chalk'}`}>
                  {msg.content}
                </div>
                <ActionBadge
                  msg={msg}
                  applied={appliedIds.has(msg.id)}
                  onApply={() => applyMessage(msg)}
                />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate border border-steel px-4 py-3 flex items-center gap-1.5">
                {[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-ash rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {historyLoaded && messages.length === 0 && !loading && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="text-xs text-ash font-mono mb-2 uppercase tracking-wider">Suggestions</div>
            <div className="flex flex-wrap gap-1.5">
              {quickMessages.map((q, i) => (
                <button key={i} onClick={() => { setInput(q); inputRef.current?.focus() }}
                  className="text-xs font-mono text-ghost border border-zinc px-2 py-1 hover:border-accent hover:text-accent transition-all">
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
              placeholder="Adapte ma séance, génère un programme… (Entrée)"
              disabled={loading}
              rows={2}
              className="flex-1 bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 resize-none focus:outline-none focus:border-accent transition-colors placeholder-zinc disabled:opacity-50"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="bg-accent text-carbon w-10 h-10 flex items-center justify-center hover:bg-opacity-90 transition-all disabled:opacity-40 text-lg flex-shrink-0">
              {loading ? <span className="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin" /> : '↑'}
            </button>
          </div>
          <div className="text-zinc text-xs font-mono mt-1.5 text-center">Gemini 2.5 Flash · Historique sauvegardé par jour</div>
        </div>
      </div>
    </>
  )
}
