'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DayItem, DayPlan, CustomDayPlan, ActivityCategory } from '@/types'
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

/** Infer category from old DayPlan type */
function inferCategory(type: string): ActivityCategory {
  if (type === 'strength') return 'strength'
  if (type === 'climb' || type === 'movement') return 'movement'
  if (type === 'recovery') return 'recovery'
  return 'event'
}

/** Convert static DayPlan template into new flat DayItem[] */
export function templateToItems(plan: DayPlan): DayItem[] {
  const cat = inferCategory(plan.type)
  return plan.sections.flatMap(section =>
    section.exercises.map(ex => ({
      id: ex.id,
      category: cat,
      activity: ex.name,
      sets: ex.sets,
      notes: ex.notes,
      checked: false,
    } as DayItem))
  )
}

export function useDayPlan(dateKey: string) {
  const [customPlan, setCustomPlan] = useState<CustomDayPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  const dayOfWeek = (() => {
    try { return format(new Date(dateKey + 'T12:00:00'), 'EEEE').toLowerCase() }
    catch { return '' }
  })()
  const defaultTemplate = weekPlan.find(p => p.key === dayOfWeek) ?? null

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
            category: data.type ?? data.category ?? 'mixed',
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

  const isCustomized = customPlan !== null
  const effectiveItems: DayItem[] = isCustomized
    ? customPlan.items
    : (defaultTemplate ? templateToItems(defaultTemplate) : [])

  const effectiveTitle = isCustomized ? customPlan.title : (defaultTemplate?.title ?? 'Jour sans programme')
  const effectiveEmoji = isCustomized ? customPlan.emoji : (defaultTemplate?.emoji ?? '📅')
  const effectiveType  = isCustomized ? customPlan.category : (defaultTemplate?.type ?? 'rest')

  const debouncedPlan = useDebounce(customPlan, 600)
  useEffect(() => {
    if (!initialized.current || !debouncedPlan) return
    setSaving(true)
    fetch(`/api/day-plan/${dateKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...debouncedPlan, type: debouncedPlan.category }),
    }).catch(() => {}).finally(() => setSaving(false))
  }, [debouncedPlan, dateKey])

  const initCustomPlan = useCallback((title?: string, emoji?: string) => {
    const items = defaultTemplate ? templateToItems(defaultTemplate) : []
    const plan: CustomDayPlan = {
      date: dateKey,
      title: title ?? defaultTemplate?.title ?? 'Nouvelle séance',
      emoji: emoji ?? defaultTemplate?.emoji ?? '📅',
      category: inferCategory(defaultTemplate?.type ?? 'event'),
      items,
    }
    setCustomPlan(plan)
    initialized.current = true
    return plan
  }, [dateKey, defaultTemplate])

  const toggleItem = useCallback((id: string) => {
    setCustomPlan(p => !p ? p : {
      ...p, items: p.items.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    })
  }, [])

  const addItem = useCallback((item: DayItem) => {
    setCustomPlan(p => !p ? p : { ...p, items: [...p.items, item] })
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<DayItem>) => {
    setCustomPlan(p => !p ? p : {
      ...p, items: p.items.map(item => item.id === id ? { ...item, ...updates } : item)
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setCustomPlan(p => !p ? p : { ...p, items: p.items.filter(item => item.id !== id) })
  }, [])

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setCustomPlan(p => {
      if (!p) return p
      const items = [...p.items]
      const [moved] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moved)
      return { ...p, items }
    })
  }, [])

  const updateMeta = useCallback((updates: Partial<Pick<CustomDayPlan, 'title' | 'emoji' | 'category'>>) => {
    setCustomPlan(p => p ? { ...p, ...updates } : p)
  }, [])

  const resetToDefault = useCallback(async () => {
    await fetch(`/api/day-plan/${dateKey}`, { method: 'DELETE' }).catch(() => {})
    setCustomPlan(null)
    initialized.current = false
    setTimeout(() => { initialized.current = true }, 100)
  }, [dateKey])

  const replacePlan = useCallback((newPlan: CustomDayPlan) => {
    setCustomPlan({ ...newPlan, date: dateKey })
  }, [dateKey])

  const applyCoachPatch = useCallback((patch: {
    skip?: string[]
    modify?: Record<string, { sets?: string; reps?: string; note?: string }>
    session_note?: string
  }) => {
    setCustomPlan(p => {
      if (!p) return p
      return {
        ...p,
        items: p.items.map(item => {
          let updated = { ...item }
          if (patch.skip?.includes(item.id)) updated.skipped = true
          if (patch.modify?.[item.id]) {
            const mod = patch.modify[item.id]
            updated = { ...updated, ...mod, coach_note: mod.note }
          }
          return updated
        }),
      }
    })
  }, [])

  return {
    customPlan, isCustomized, loading, saving, defaultTemplate,
    effectiveItems, effectiveTitle, effectiveEmoji, effectiveType,
    initCustomPlan, toggleItem, addItem, updateItem, removeItem,
    moveItem, updateMeta, resetToDefault, replacePlan, applyCoachPatch,
  }
}
