'use client'

import { useState, useEffect } from 'react'
import { DayPlan } from '@/types'

interface LiftEntry {
  id?: number
  exercise_id: string
  exercise: string
  sets: string
  reps: string
  weight_kg: string
}

interface Props {
  dateKey: string
  dayPlan: DayPlan
}

const LOGGABLE_EXERCISES = [
  'mon-1', 'mon-2', 'mon-3', 'mon-4', 'mon-5', 'mon-6',
  'thu-1', 'thu-2', 'thu-3', 'thu-4', 'thu-5',
]

export function LiftLogger({ dateKey, dayPlan }: Props) {
  const [logs, setLogs] = useState<Record<string, LiftEntry>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const exercises = dayPlan.sections
    .flatMap(s => s.exercises)
    .filter(e => LOGGABLE_EXERCISES.includes(e.id))

  useEffect(() => {
    fetch(`/api/lifts?days=1`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return
        const today = data.filter(d => d.date?.startsWith(dateKey))
        const map: Record<string, LiftEntry> = {}
        today.forEach(d => {
          map[d.exercise_id] = {
            id: d.id,
            exercise_id: d.exercise_id,
            exercise: d.exercise,
            sets: d.sets?.toString() ?? '',
            reps: d.reps?.toString() ?? '',
            weight_kg: d.weight_kg?.toString() ?? '',
          }
        })
        setLogs(map)
      })
      .catch(() => {})
  }, [dateKey])

  const updateLog = (exerciseId: string, field: keyof LiftEntry, value: string) => {
    setLogs(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        exercise_id: exerciseId,
        exercise: exercises.find(e => e.id === exerciseId)?.name ?? exerciseId,
        sets: prev[exerciseId]?.sets ?? '',
        reps: prev[exerciseId]?.reps ?? '',
        weight_kg: prev[exerciseId]?.weight_kg ?? '',
        [field]: value,
      },
    }))
  }

  const saveLog = async (exerciseId: string) => {
    const log = logs[exerciseId]
    if (!log || (!log.sets && !log.reps && !log.weight_kg)) return
    setSaving(exerciseId)
    try {
      await fetch('/api/lifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          exercise_id: exerciseId,
          exercise: log.exercise,
          sets: log.sets ? parseInt(log.sets) : null,
          reps: log.reps ? parseInt(log.reps) : null,
          weight_kg: log.weight_kg ? parseFloat(log.weight_kg) : null,
        }),
      })
    } catch {}
    setSaving(null)
  }

  if (exercises.length === 0) return null

  return (
    <div className="border-t border-steel pt-4">
      <div className="text-xs text-ash tracking-[0.2em] uppercase mb-3 font-mono">Logger la performance</div>
      <div className="space-y-3">
        {exercises.map(ex => {
          const log = logs[ex.id] ?? {}
          const isSaving = saving === ex.id
          return (
            <div key={ex.id} className="bg-carbon border border-zinc p-3 rounded">
              <div className="text-xs text-ghost font-mono mb-2 truncate">{ex.name}</div>
              <div className="flex gap-2">
                {[
                  { field: 'sets' as keyof LiftEntry, label: 'Séries', placeholder: '3' },
                  { field: 'reps' as keyof LiftEntry, label: 'Reps', placeholder: '8' },
                  { field: 'weight_kg' as keyof LiftEntry, label: 'kg', placeholder: 'PC' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="flex-1">
                    <label className="text-zinc text-xs block mb-1">{label}</label>
                    <input
                      type="number" min="0" placeholder={placeholder}
                      value={(log as any)[field] ?? ''}
                      onChange={e => updateLog(ex.id, field, e.target.value)}
                      onBlur={() => saveLog(ex.id)}
                      className="w-full bg-steel border border-zinc text-chalk text-sm font-mono px-2 py-1.5 focus:outline-none focus:border-ghost"
                    />
                  </div>
                ))}
                <div className="flex items-end pb-0.5">
                  {isSaving
                    ? <span className="text-zinc text-xs font-mono">…</span>
                    : (log.sets || log.reps) && <span className="text-accent text-xs">✓</span>
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
