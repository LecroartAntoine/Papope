'use client'

import { useState, useEffect, useRef } from 'react'
import { nutritionTargets } from '@/lib/planData'
import { useDayState } from '@/lib/useCheckState'

type NutritionState = {
  proteines_g: string
  collagene_g: string
  creatine_g: string
  eau_ml: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span style={{ color }}>{value}</span>
        <span className="text-ash">/ {target}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-zinc text-xs font-mono mt-0.5 text-right">{pct}%</div>
    </div>
  )
}

interface Props {
  dateKey: string
  isClimbDay: boolean
}

export function NutritionPanel({ dateKey, isClimbDay }: Props) {
  const { state, setWeight } = useDayState(dateKey)
  const [nutrition, setNutrition] = useState<NutritionState>({
    proteines_g: '',
    collagene_g: '',
    creatine_g: '',
    eau_ml: '',
  })
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    initialized.current = false
    setNutrition({ proteines_g: '', collagene_g: '', creatine_g: '', eau_ml: '' })
    fetch(`/api/nutrition?date=${dateKey}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setNutrition({
            proteines_g: data.proteines_g != null ? String(data.proteines_g) : '',
            collagene_g: data.collagene_g != null ? String(data.collagene_g) : '',
            creatine_g: data.creatine_g != null ? String(data.creatine_g) : '',
            eau_ml: data.eau_ml != null ? String(data.eau_ml) : '',
          })
        }
      })
      .catch(() => {})
      .finally(() => { setTimeout(() => { initialized.current = true }, 100) })
  }, [dateKey])

  const debounced = useDebounce(nutrition, 900)

  useEffect(() => {
    if (!initialized.current) return
    setSaving(true)
    fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: dateKey,
        proteines_g: debounced.proteines_g ? parseFloat(debounced.proteines_g) : null,
        collagene_g: debounced.collagene_g ? parseFloat(debounced.collagene_g) : null,
        creatine_g: debounced.creatine_g ? parseFloat(debounced.creatine_g) : null,
        eau_ml: debounced.eau_ml ? parseInt(debounced.eau_ml) : null,
      }),
    }).catch(() => {}).finally(() => setSaving(false))
  }, [debounced, dateKey])

  const update = (field: keyof NutritionState, value: string) =>
    setNutrition(s => ({ ...s, [field]: value }))

  type FieldDef = {
    key: keyof NutritionState
    label: string
    unit: string
    target: number
    color: string
    step: string
    hint?: string
  }

  const baseFields: FieldDef[] = [
    { key: 'proteines_g', label: 'Protéines', unit: 'g', target: nutritionTargets.proteines_g, color: '#C8F135', step: '1' },
    { key: 'creatine_g', label: 'Créatine', unit: 'g', target: nutritionTargets.creatine_g, color: '#F5A623', step: '0.5' },
    { key: 'eau_ml', label: 'Eau', unit: 'ml', target: nutritionTargets.eau_ml, color: '#64D8FF', step: '100' },
  ]

  const collageneField: FieldDef = {
    key: 'collagene_g',
    label: 'Collagène',
    unit: 'g',
    target: nutritionTargets.collagene_g,
    color: '#4EA8FF',
    step: '0.5',
    hint: '30–60 min avant la séance',
  }

  // Collagen only visible on climb days
  const fields = isClimbDay
    ? [baseFields[0], collageneField, ...baseFields.slice(1)]
    : baseFields

  return (
    <div className="space-y-4">
      <div className="border border-steel bg-slate">
        <div className="px-5 py-3 border-b border-steel flex items-center justify-between">
          <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono">Nutrition du jour</div>
          {saving && <span className="text-zinc text-xs font-mono animate-pulse">sauvegarde…</span>}
        </div>

        {/* Collagen reminder banner on climb days */}
        {isClimbDay && (
          <div className="mx-4 mt-4 px-3 py-2 border border-info border-opacity-30 bg-info bg-opacity-5 text-xs font-mono text-info flex items-center gap-2">
            <span>⏱</span>
            <span>Jour d'escalade — prendre le collagène <strong>30–60 min avant</strong> la séance</span>
          </div>
        )}

        <div className="p-4 space-y-5">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs text-ash tracking-[0.15em] uppercase font-mono mb-1">
                {f.label}
                <span className="text-zinc normal-case font-normal ml-1">— objectif {f.target}{f.unit}</span>
                {f.hint && <span className="text-info normal-case font-normal ml-1">· {f.hint}</span>}
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  step={f.step}
                  placeholder="0"
                  value={nutrition[f.key]}
                  onChange={e => update(f.key, e.target.value)}
                  className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-ghost transition-colors"
                />
                <span className="text-ash text-sm font-mono flex-shrink-0 w-8">{f.unit}</span>
              </div>
              <ProgressBar
                value={parseFloat(nutrition[f.key] || '0')}
                target={f.target}
                color={f.color}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Poids corporel */}
      <div className="border border-steel bg-slate p-4">
        <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-3">Poids corporel</div>
        <div className="flex items-center gap-2">
          <input
            type="number" step="0.1" min="50" max="200"
            value={state.weight ?? ''}
            onChange={e => setWeight(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="84.0"
            className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-ghost transition-colors"
          />
          <span className="text-ash text-sm font-mono flex-shrink-0">kg</span>
        </div>
      </div>

      {/* Règles clés */}
      <div className="border border-crit border-opacity-30 bg-crit bg-opacity-5 p-4 text-xs font-mono space-y-1.5">
        <div className="text-crit tracking-wider uppercase mb-2">⚠ Règles clés</div>
        <div className="text-ghost">• Pas de campus board avant 6–9 mois</div>
        <div className="text-ghost">• Pas d'entraînement max des doigts</div>
        <div className="text-ghost">• Douleur ≥4/10 à l'escalade → arrêter</div>
        <div className="text-ghost">• Décharge toutes les 4 semaines (−30%)</div>
      </div>
    </div>
  )
}
