'use client'

import { useState, useEffect, useRef } from 'react'
import { WellbeingLog } from '@/types'

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

const defaultState = (): WellbeingLog => ({
  humeur: null,
  fatigue: null,
  stress: null,
  sommeil_h: null,
  alcool_verres: null,
  douleur_generale: null,
  notes_perso: '',
})

// Scale selector 1-10
function ScaleSelector({
  value, onChange, lowLabel, highLabel, colorFn,
}: {
  value: number | null
  onChange: (v: number | null) => void
  lowLabel: string
  highLabel: string
  colorFn: (v: number) => string
}) {
  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onChange(value === n ? null : n)}
            className="w-8 h-8 text-xs font-mono font-bold border transition-all flex-shrink-0"
            style={
              value === n
                ? { background: colorFn(n), borderColor: colorFn(n), color: n >= 7 ? '#fff' : '#141414' }
                : { borderColor: '#3A3A3A', color: '#888' }
            }
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-zinc text-xs font-mono">{lowLabel}</span>
        <span className="text-zinc text-xs font-mono">{highLabel}</span>
      </div>
    </div>
  )
}

// For mood: high=good (green), low=bad (red)
const moodColor = (v: number) => v >= 7 ? '#C8F135' : v >= 4 ? '#F5A623' : '#FF4E4E'
// For fatigue/stress: high=bad (red), low=good (green)
const badHighColor = (v: number) => v >= 7 ? '#FF4E4E' : v >= 4 ? '#F5A623' : '#C8F135'
// For pain: same as bad high
const painColor = (v: number) => v >= 7 ? '#FF4E4E' : v >= 4 ? '#F5A623' : '#C8F135'

interface Props {
  dateKey: string
}

export function DailyWellbeing({ dateKey }: Props) {
  const [state, setState] = useState<WellbeingLog>(defaultState())
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    initialized.current = false
    setState(defaultState())
    fetch(`/api/wellbeing?date=${dateKey}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setState({
            humeur: data.humeur ?? null,
            fatigue: data.fatigue ?? null,
            stress: data.stress ?? null,
            sommeil_h: data.sommeil_h != null ? parseFloat(data.sommeil_h) : null,
            alcool_verres: data.alcool_verres ?? null,
            douleur_generale: data.douleur_generale ?? null,
            notes_perso: data.notes_perso ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => { setTimeout(() => { initialized.current = true }, 100) })
  }, [dateKey])

  const debounced = useDebounce(state, 800)

  useEffect(() => {
    if (!initialized.current) return
    setSaving(true)
    fetch('/api/wellbeing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateKey, ...debounced }),
    }).catch(() => {}).finally(() => setSaving(false))
  }, [debounced, dateKey])

  const set = (field: keyof WellbeingLog, value: any) =>
    setState(s => ({ ...s, [field]: value }))

  // Build a small status row to show what's been filled
  const filled = [
    state.humeur, state.fatigue, state.stress,
    state.sommeil_h, state.alcool_verres, state.douleur_generale,
  ].filter(v => v !== null).length
  const total = 6

  return (
    <div className="border border-steel bg-slate">
      <div className="px-5 py-4 border-b border-steel flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">🌡</span>
            <span className="text-xs text-info tracking-[0.2em] uppercase font-mono">bien-être</span>
            {saving && <span className="text-zinc text-xs font-mono animate-pulse">sauvegarde…</span>}
          </div>
          <div className="font-display text-xl font-bold tracking-tight text-chalk">Suivi du jour</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-lg" style={{ color: filled === total ? '#C8F135' : '#888' }}>
            {filled}/{total}
          </div>
          <div className="text-zinc text-xs">renseigné</div>
        </div>
      </div>

      <div className="p-5 space-y-6">

        {/* Humeur */}
        <div>
          <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-3">
            😊 Humeur
          </div>
          <ScaleSelector
            value={state.humeur}
            onChange={v => set('humeur', v)}
            lowLabel="Très mauvaise"
            highLabel="Excellente"
            colorFn={moodColor}
          />
        </div>

        {/* Fatigue */}
        <div>
          <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-3">
            😴 Fatigue
          </div>
          <ScaleSelector
            value={state.fatigue}
            onChange={v => set('fatigue', v)}
            lowLabel="Bien reposé"
            highLabel="Épuisé"
            colorFn={badHighColor}
          />
        </div>

        {/* Stress */}
        <div>
          <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-3">
            🧠 Stress
          </div>
          <ScaleSelector
            value={state.stress}
            onChange={v => set('stress', v)}
            lowLabel="Zen"
            highLabel="Très stressé"
            colorFn={badHighColor}
          />
        </div>

        {/* Douleur générale */}
        <div>
          <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-3">
            🤕 Douleur générale (corps entier)
          </div>
          <ScaleSelector
            value={state.douleur_generale}
            onChange={v => set('douleur_generale', v)}
            lowLabel="Aucune"
            highLabel="Intense"
            colorFn={painColor}
          />
        </div>

        {/* Sommeil */}
        <div>
          <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-3">
            🌙 Durée de sommeil
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" max="24" step="0.5"
              placeholder="7.5"
              value={state.sommeil_h ?? ''}
              onChange={e => set('sommeil_h', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-32 bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-ghost transition-colors"
            />
            <span className="text-ash text-sm font-mono">heures</span>
            {state.sommeil_h !== null && (
              <span className={`text-xs font-mono ml-2 ${
                state.sommeil_h >= 7.5 ? 'text-accent' :
                state.sommeil_h >= 6 ? 'text-warn' : 'text-crit'
              }`}>
                {state.sommeil_h >= 7.5 ? '✓ Optimal' : state.sommeil_h >= 6 ? '⚠ Insuffisant' : '✗ Trop court'}
              </span>
            )}
          </div>
        </div>

        {/* Alcool */}
        <div>
          <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-3">
            🍷 Consommation d'alcool
          </div>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <button
                key={n}
                onClick={() => set('alcool_verres', state.alcool_verres === n ? null : n)}
                className="w-9 h-9 text-xs font-mono font-bold border transition-all"
                style={
                  state.alcool_verres === n
                    ? {
                        background: n === 0 ? '#C8F135' : n <= 2 ? '#F5A623' : '#FF4E4E',
                        borderColor: n === 0 ? '#C8F135' : n <= 2 ? '#F5A623' : '#FF4E4E',
                        color: '#141414',
                      }
                    : { borderColor: '#3A3A3A', color: '#888' }
                }
              >
                {n === 0 ? '∅' : n}
              </button>
            ))}
            <span className="text-zinc text-xs font-mono self-center ml-1">verres</span>
          </div>
        </div>

        {/* Notes perso */}
        <div>
          <div className="text-xs text-ash tracking-[0.2em] uppercase mb-2 font-mono">
            📝 Notes personnelles
          </div>
          <textarea
            value={state.notes_perso}
            onChange={e => set('notes_perso', e.target.value)}
            placeholder="Comment vas-tu aujourd'hui ? Émotions, événements, réflexions..."
            className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 resize-none focus:outline-none focus:border-ghost placeholder-zinc transition-colors"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
