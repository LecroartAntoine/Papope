'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type DayCheckState = {
  exercises: Record<string, boolean>
  skipped: Record<string, boolean>       // exercises skipped by AI coach
  modifications: Record<string, { sets?: string; reps?: string; note?: string }> // AI overrides
  notes: string
  painLevel: number | null
  weight: number | null
}

const defaultState = (): DayCheckState => ({
  exercises: {},
  skipped: {},
  modifications: {},
  notes: '',
  painLevel: null,
  weight: null,
})

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useDayState(dateKey: string) {
  const [state, setState] = useState<DayCheckState>(defaultState())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  // Load session from DB
  useEffect(() => {
    initialized.current = false
    setLoading(true)
    setState(defaultState())

    fetch(`/api/session/${dateKey}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setState(s => ({
            ...s,
            exercises: data.exercises ?? {},
            skipped: data.skipped ?? {},
            modifications: data.modifications ?? {},
            notes: data.notes ?? '',
            painLevel: data.pain_level ?? null,
          }))
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setTimeout(() => { initialized.current = true }, 100)
      })
  }, [dateKey])

  // Load weight from body_metrics
  useEffect(() => {
    fetch(`/api/metrics?days=1`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const entry = data.find((d: any) => d.date?.startsWith(dateKey))
          if (entry) setState(s => ({ ...s, weight: parseFloat(entry.weight_kg) }))
        }
      })
      .catch(() => {})
  }, [dateKey])

  // Debounced save to DB
  const debouncedState = useDebounce(state, 800)

  useEffect(() => {
    if (!initialized.current) return
    setSaving(true)
    fetch(`/api/session/${dateKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercises: debouncedState.exercises,
        skipped: debouncedState.skipped,
        modifications: debouncedState.modifications,
        notes: debouncedState.notes,
        pain_level: debouncedState.painLevel,
      }),
    })
      .catch(() => {})
      .finally(() => setSaving(false))
  }, [debouncedState, dateKey])

  const toggleItem = useCallback((id: string) => {
    setState(s => ({
      ...s,
      exercises: { ...s.exercises, [id]: !s.exercises[id] },
    }))
  }, [])

  const setNotes = useCallback((notes: string) => {
    setState(s => ({ ...s, notes }))
  }, [])

  const setPainLevel = useCallback((painLevel: number | null) => {
    setState(s => ({ ...s, painLevel }))
  }, [])

  const setWeight = useCallback((weight: number | null) => {
    setState(s => ({ ...s, weight }))
    if (weight !== null) {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, weight_kg: weight }),
      }).catch(() => {})
    }
  }, [dateKey])

  // Apply a patch from the AI coach — skips and modifies exercises
  const applyPatch = useCallback((patch: {
    skip?: string[]
    modify?: Record<string, { sets?: string; reps?: string; note?: string }>
    session_note?: string
    convert_to_recovery?: boolean
  }) => {
    setState(s => {
      const newSkipped = { ...s.skipped }
      const newMods = { ...s.modifications }
      let newNotes = s.notes

      if (Array.isArray(patch.skip)) {
        patch.skip.forEach(id => { newSkipped[id] = true })
      }

      if (patch.modify) {
        Object.entries(patch.modify).forEach(([id, mod]) => {
          newMods[id] = mod
        })
      }

      if (patch.session_note) {
        const aiNote = `[Coach IA] ${patch.session_note}`
        newNotes = s.notes ? `${s.notes}\n${aiNote}` : aiNote
      }

      return { ...s, skipped: newSkipped, modifications: newMods, notes: newNotes }
    })
  }, [])

  return {
    state,
    loading,
    saving,
    toggleItem,
    setNotes,
    setPainLevel,
    setWeight,
    applyPatch,
  }
}
