'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DayItem, DayPlan, CustomDayPlan, ExerciseItem } from '@/types'
import { weekPlan } from './planData'
import { format } from 'date-fns'

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

/** Convert old-style static DayPlan template into DayItem[] */
export function templateToItems(plan: DayPlan): DayItem[] {
  const items: DayItem[] = []
  for (const section of plan.sections) {
    for (const ex of section.exercises) {
      items.push({
        id: ex.id,
        type: 'exercise',
        name: ex.name,
        sets: ex.sets,
        notes: ex.notes,
        checked: false,
      } as ExerciseItem)
    }
  }
  return items
}

/** Derive day emoji + label from item types */
export function inferDayMeta(items: DayItem[]): { emoji: string; type: string } {
  const types = items.map(i => i.type)
  if (types.includes('hike')) return { emoji: '🏔', type: 'hike' }
  if (types.includes('climb')) return { emoji: '🔵', type: 'climb' }
  if (types.every(t => t === 'rest')) return { emoji: '⚪', type: 'rest' }
  if (types.includes('cardio')) return { emoji: '🟡', type: 'cardio' }
  return { emoji: '🟢', type: 'exercise' }
}

export function useDayPlan(dateKey: string) {
  const [customPlan, setCustomPlan] = useState<CustomDayPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  // Find the default template for this date
  const dayOfWeek = (() => {
    try {
      const d = new Date(dateKey + 'T12:00:00')
      return format(d, 'EEEE').toLowerCase()
    } catch { return '' }
  })()
  const defaultTemplate = weekPlan.find(p => p.key === dayOfWeek) ?? null

  // Load custom plan from DB
  useEffect(() => {
    initialized.current = false
    setLoading(true)
    setCustomPlan(null)

    fetch(`/api/day-plan/${dateKey}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setCustomPlan({
            date: data.date,
            title: data.title,
            emoji: data.emoji,
            type: data.type,
            items: data.items ?? [],
          })
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setTimeout(() => { initialized.current = true }, 100)
      })
  }, [dateKey])

  // The effective items to display: custom if exists, else default template
  const isCustomized = customPlan !== null
  const effectiveItems: DayItem[] = isCustomized
    ? customPlan.items
    : (defaultTemplate ? templateToItems(defaultTemplate) : [])

  const effectiveTitle = isCustomized
    ? customPlan.title
    : (defaultTemplate?.title ?? 'Jour sans programme')

  const effectiveEmoji = isCustomized
    ? customPlan.emoji
    : (defaultTemplate?.emoji ?? '📅')

  const effectiveType = isCustomized
    ? customPlan.type
    : (defaultTemplate?.type ?? 'rest')

  // Debounced save
  const debouncedPlan = useDebounce(customPlan, 600)

  useEffect(() => {
    if (!initialized.current || !debouncedPlan) return
    setSaving(true)
    fetch(`/api/day-plan/${dateKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debouncedPlan),
    }).catch(() => {}).finally(() => setSaving(false))
  }, [debouncedPlan, dateKey])

  // ─── Mutations ────────────────────────────────────────────────────────────────

  /** Initialize custom plan from template or empty */
  const initCustomPlan = useCallback((title?: string, emoji?: string) => {
    const items = defaultTemplate ? templateToItems(defaultTemplate) : []
    const plan: CustomDayPlan = {
      date: dateKey,
      title: title ?? defaultTemplate?.title ?? 'Nouvelle séance',
      emoji: emoji ?? defaultTemplate?.emoji ?? '📅',
      type: defaultTemplate?.type ?? 'mixed',
      items,
    }
    setCustomPlan(plan)
    return plan
  }, [dateKey, defaultTemplate])

  /** Toggle item checked */
  const toggleItem = useCallback((id: string) => {
    setCustomPlan(p => {
      if (!p) return p
      return {
        ...p,
        items: p.items.map(item =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      }
    })
  }, [])

  /** Add a new item */
  const addItem = useCallback((item: DayItem) => {
    setCustomPlan(p => {
      if (!p) return p
      return { ...p, items: [...p.items, item] }
    })
  }, [])

  /** Update an existing item */
  const updateItem = useCallback((id: string, updates: Partial<DayItem>) => {
    setCustomPlan(p => {
      if (!p) return p
      return {
        ...p,
        items: p.items.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }
    })
  }, [])

  /** Remove an item */
  const removeItem = useCallback((id: string) => {
    setCustomPlan(p => {
      if (!p) return p
      return { ...p, items: p.items.filter(item => item.id !== id) }
    })
  }, [])

  /** Reorder items */
  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setCustomPlan(p => {
      if (!p) return p
      const items = [...p.items]
      const [moved] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moved)
      return { ...p, items }
    })
  }, [])

  /** Update plan meta (title, emoji) */
  const updateMeta = useCallback((updates: Partial<Pick<CustomDayPlan, 'title' | 'emoji' | 'type'>>) => {
    setCustomPlan(p => p ? { ...p, ...updates } : p)
  }, [])

  /** Reset to default template (delete custom plan) */
  const resetToDefault = useCallback(async () => {
    await fetch(`/api/day-plan/${dateKey}`, { method: 'DELETE' }).catch(() => {})
    setCustomPlan(null)
    initialized.current = false
    setTimeout(() => { initialized.current = true }, 100)
  }, [dateKey])

  /** Replace entire plan (from coach AI) */
  const replacePlan = useCallback((newPlan: CustomDayPlan) => {
    setCustomPlan({ ...newPlan, date: dateKey })
  }, [dateKey])

  /** Apply coach patch to existing items */
  const applyCoachPatch = useCallback((patch: {
    skip?: string[]
    modify?: Record<string, { sets?: string; reps?: string; note?: string }>
    session_note?: string
  }) => {
    setCustomPlan(p => {
      if (!p) return p
      const items = p.items.map(item => {
        let updated = { ...item }
        if (patch.skip?.includes(item.id)) {
          updated.skipped = true
        }
        if (patch.modify?.[item.id]) {
          const mod = patch.modify[item.id]
          updated = { ...updated, ...mod, coach_note: mod.note }
        }
        return updated
      })
      return { ...p, items }
    })
  }, [])

  return {
    // State
    customPlan,
    isCustomized,
    loading,
    saving,
    defaultTemplate,
    // Effective values (custom or default)
    effectiveItems,
    effectiveTitle,
    effectiveEmoji,
    effectiveType,
    // Actions
    initCustomPlan,
    toggleItem,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    updateMeta,
    resetToDefault,
    replacePlan,
    applyCoachPatch,
  }
}
