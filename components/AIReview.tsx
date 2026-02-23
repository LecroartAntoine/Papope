'use client'

import { useState } from 'react'

export function AIReview() {
  const [review, setReview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const fetchReview = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai-review', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReview(data.review)
      setLastFetched(new Date())
    } catch (e: any) {
      setError(e.message ?? 'Une erreur est survenue')
    }
    setLoading(false)
  }

  const renderReview = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim())
    return lines.map((line, i) => {
      if (line.match(/^#+\s/) || line.match(/^\d+\./)) {
        const content = line.replace(/^#+\s/, '').replace(/^\d+\.\s*/, '')
        return (
          <div key={i} className="mt-5 first:mt-0">
            <div className="text-accent font-mono text-xs uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-accent inline-block" />
              {line.match(/^\d+\./) ? `0${line.match(/^\d+/)?.[0]}` : ''} {content}
            </div>
          </div>
        )
      }
      if (line.match(/^[•\-*]\s/)) {
        return (
          <div key={i} className="flex gap-2 mt-1.5">
            <span className="text-accent mt-0.5 flex-shrink-0">▸</span>
            <span className="text-chalk text-sm font-mono leading-relaxed">
              {line.replace(/^[•\-*]\s*/, '')}
            </span>
          </div>
        )
      }
      if (line.startsWith('**') || line.match(/^\*\*.+\*\*/)) {
        return (
          <p key={i} className="text-chalk text-sm font-mono font-bold leading-relaxed mt-2">
            {line.replace(/\*\*/g, '')}
          </p>
        )
      }
      return (
        <p key={i} className="text-ghost text-sm font-mono leading-relaxed mt-2">{line}</p>
      )
    })
  }

  return (
    <div className="bg-slate border border-steel">
      <div className="px-5 py-4 border-b border-steel flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">🤖</span>
            <span className="text-xs text-accent tracking-[0.2em] uppercase font-mono">Coach IA — Gemini</span>
          </div>
          <div className="font-display text-xl font-bold tracking-tight text-chalk">Bilan de la semaine</div>
          <div className="text-ash text-xs font-mono mt-0.5">
            Analyse tes 7 derniers jours : entraînement, nutrition, bien-être
          </div>
        </div>
        <button
          onClick={fetchReview}
          disabled={loading}
          className="bg-accent text-carbon font-display font-bold text-sm tracking-wider px-5 py-2.5 uppercase hover:bg-opacity-90 transition-all disabled:opacity-50 flex-shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-carbon border-t-transparent rounded-full animate-spin" />
              Analyse…
            </span>
          ) : review ? 'Actualiser' : 'Analyser la semaine'}
        </button>
      </div>

      <div className="p-5">
        {!review && !loading && !error && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-ash text-sm font-mono">
              Clique sur "Analyser la semaine" pour recevoir des conseils personnalisés
            </div>
            <div className="text-zinc text-xs font-mono mt-2">
              Utilise tes séances, douleurs, nutrition et bien-être loggés
            </div>
            <div className="mt-4 text-xs text-zinc font-mono border border-steel inline-block px-3 py-1.5">
              Propulsé par Google Gemini 1.5 Flash (API gratuite)
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3 py-4">
            {[80, 60, 90, 70, 50].map((w, i) => (
              <div key={i} className="h-4 bg-steel animate-pulse rounded"
                style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }} />
            ))}
            <div className="text-zinc text-xs font-mono mt-4 text-center">
              Gemini analyse tes données d'entraînement…
            </div>
          </div>
        )}

        {error && (
          <div className="border border-crit border-opacity-30 bg-crit bg-opacity-5 p-4 text-xs font-mono text-crit">
            <div className="font-bold mb-1">Erreur</div>
            {error}
            {error.includes('GEMINI_API_KEY') && (
              <div className="text-ghost mt-2">
                Ajoute <code className="bg-steel px-1">GEMINI_API_KEY</code> dans tes variables d'environnement Vercel.
                Clé gratuite sur <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-accent underline">aistudio.google.com</a>
              </div>
            )}
          </div>
        )}

        {review && !loading && (
          <div>
            <div className="space-y-1">{renderReview(review)}</div>
            {lastFetched && (
              <div className="text-zinc text-xs font-mono mt-6 pt-4 border-t border-steel">
                Généré à {lastFetched.toLocaleTimeString('fr-FR')} · Basé sur les 7 derniers jours
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
