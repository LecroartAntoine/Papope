'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DayItem } from '@/types'

interface Props {
  dateKey: string
  currentItems: DayItem[]
  isClimbDay: boolean
  onRefreshDay: () => void
  onSupplementsUpdated: () => void
}

interface ChatMessage {
  id: number
  role: 'user' | 'coach'
  content: string
  actions?: {
    weekPatch?: boolean
    dayPatch?: boolean
    supplementPatch?: boolean
    supplementUpdates?: boolean
  }
}

function ActionChip({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 border"
      style={{ borderColor: `${color}50`, color, background: `${color}10` }}>
      {icon} {label}
    </span>
  )
}

export function CoachChat({ dateKey, currentItems, isClimbDay, onRefreshDay, onSupplementsUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load history
  useEffect(() => {
    setMessages([])
    setHistoryLoaded(false)
    fetch(`/api/coach?date=${dateKey}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const msgs: ChatMessage[] = data.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            actions: m.patch ? m.patch : undefined,
          }))
          setMessages(msgs)
          if (msgs.length > 0 && !open) setHasUnread(true)
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
    const tempId = Date.now()
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMsg }])

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          message: userMsg,
          currentItems,
          isClimbDay,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Build actions summary for the message badge
      const actions = {
        weekPatch: !!(data.weekPatch && data.weekPatch.length > 0),
        dayPatch: !!data.dayPatch,
        supplementPatch: !!(data.supplementPatch?.entries?.length),
        supplementUpdates: !!(data.supplementUpdates?.length),
      }

      // Refresh UI based on what changed
      if (actions.weekPatch || actions.dayPatch) onRefreshDay()
      if (actions.supplementPatch || actions.supplementUpdates) onSupplementsUpdated()

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'coach',
        content: data.message || '…',
        actions: Object.values(actions).some(Boolean) ? actions : undefined,
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now() + 2, role: 'coach', content: `Erreur : ${err.message}` }])
    }
    setLoading(false)
  }, [input, loading, dateKey, currentItems, isClimbDay, onRefreshDay, onSupplementsUpdated])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const suggestions = [
    "Cette semaine je veux de l'escalade mardi et vendredi, 2 séance de Beat Saber et 2 séances de marche longue.",
    'Mes bras font très mal aujourd\'hui',
    "Génère une séance force pour aujourd'hui",
    'Quelle intensité pour la semaine vu ma fatigue ?',
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 max-w-14 max-h-14 overflow-hidden bg-black text-carbon rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all active:scale-95"
        aria-label="Coach IA"
      >

        <img
          className="rounded-full h-14 w-14"
          src="/oh.png"
          alt="Geifni"
        />
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-carbon bg-opacity-60 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Panel */}
      <div
        className={`fixed bottom-0 right-0 z-50 w-full sm:w-[460px] h-[90vh] sm:h-[680px] sm:bottom-6 sm:right-6 bg-carbon border border-steel flex flex-col transition-all duration-300 ${
          open ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0 pointer-events-none'
        }`}
        style={{ boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-steel flex items-center justify-between flex-shrink-0 bg-slate">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-xl flex-shrink-0">
              <img
                className="object-fit object-center rounded-full h-8 w-8"
                src="/oh.png"
                alt="Gefini"
              />
            </div>
            <div>
              <div className="text-chalk text-sm font-mono font-bold">Denis</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-ash hover:text-chalk w-8 h-8 flex items-center justify-center text-lg">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {historyLoaded && messages.length === 0 && (
            <div className="text-center py-10">
              <div className="text-chalk text-sm font-mono font-bold mb-2">Ton tortionnaire</div>
              <div className="text-ash text-xs font-mono leading-relaxed max-w-xs mx-auto">
                Good Day le monsieur, fait péter le tier gratuit !
              </div>
            </div>
          )}

          {!historyLoaded && (
            <div className="space-y-3 pt-2">
              {[1,2,3].map(i => (
                <div key={i} className={`flex ${i%2===0?'justify-start':'justify-end'}`}>
                  <div className="h-14 w-52 bg-steel animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={msg.id ?? idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`text-xs font-mono mb-1 ${msg.role === 'user' ? 'text-ash' : 'text-accent'}`}>
                  {msg.role === 'user' ? 'Moi' : 'Denis'}
                </div>
                <div className={`px-3 py-2.5 text-sm font-mono leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-accent text-carbon' : 'bg-slate border border-steel text-chalk'
                }`}>
                  {msg.content}
                </div>
                {/* Action chips */}
                {msg.actions && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {msg.actions.weekPatch && <ActionChip icon="📅" label="Semaine planifiée" color="#4EA8FF" />}
                    {msg.actions.dayPatch && <ActionChip icon="✏️" label="Jour modifié" color="#F5A623" />}
                    {msg.actions.supplementPatch && <ActionChip icon="🥗" label="Nutrition loggée" color="#C8F135" />}
                    {msg.actions.supplementUpdates && <ActionChip icon="⚙️" label="Suppléments mis à jour" color="#A78BFA" />}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate border border-steel px-4 py-3.5 flex items-center gap-1.5">
                {[0,150,300].map(d => (
                  <span key={d} className="w-2 h-2 bg-ash rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {historyLoaded && messages.length === 0 && !loading && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="text-xs text-ash font-mono mb-2 uppercase tracking-wider">Par exemple…</div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((q, i) => (
                <button key={i}
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                  className="text-xs font-mono text-ghost border border-zinc px-2 py-1 hover:border-accent hover:text-accent transition-all text-left leading-snug">
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
              placeholder="Planifie, modifie, demande un conseil… (Entrée pour envoyer)"
              disabled={loading}
              rows={2}
              className="flex-1 bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 resize-none focus:outline-none focus:border-accent transition-colors placeholder-zinc disabled:opacity-50"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="bg-accent text-carbon w-10 h-10 flex items-center justify-center hover:bg-opacity-90 transition-all disabled:opacity-40 text-lg flex-shrink-0">
              {loading
                ? <span className="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin" />
                : '↑'}
            </button>
          </div>
          <div className="text-zinc text-xs font-mono mt-1.5 text-center">Gefini</div>
        </div>
      </div>
    </>
  )
}
