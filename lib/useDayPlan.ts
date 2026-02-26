'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DayItem, CustomDayPlan, ActivityCategory } from '@/types'

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

export function useDayPlan(dateKey: string, refreshKey: number = 0) {
  const [plan, setPlan] = useState<CustomDayPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  // Load from DB — re-runs when dateKey or refreshKey changes
  useEffect(() => {
    initialized.current = false
    setLoading(true)
    setPlan(null)
    fetch(`/api/day-plan/${dateKey}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setPlan({
            date: dateKey,
            title: data.title ?? '',
            emoji: data.emoji ?? '📅',
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
  }, [dateKey, refreshKey])

  // Debounced auto-save
  const debouncedPlan = useDebounce(plan, 700)
  useEffect(() => {
    if (!initialized.current || !debouncedPlan) return
    setSaving(true)
    fetch(`/api/day-plan/${dateKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...debouncedPlan, type: debouncedPlan.category }),
    }).catch(() => {}).finally(() => setSaving(false))
  }, [debouncedPlan, dateKey])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const toggleItem = useCallback((id: string) => {
    setPlan(p => !p ? p : {
      ...p,
      items: p.items.map(item => item.id === id ? { ...item, checked: !item.checked } : item),
    })
  }, [])

  const addItem = useCallback((item: DayItem) => {
    setPlan(p => {
      const base = p ?? { date: dateKey, title: '', emoji: '📅', category: 'mixed' as const, items: [] }
      initialized.current = true
      return { ...base, items: [...base.items, item] }
    })
  }, [dateKey])

  const updateItem = useCallback((id: string, updates: Partial<DayItem>) => {
    setPlan(p => !p ? p : {
      ...p,
      items: p.items.map(item => item.id === id ? { ...item, ...updates } : item),
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setPlan(p => !p ? p : { ...p, items: p.items.filter(item => item.id !== id) })
  }, [])

  return {
    plan, loading, saving,
    hasPlan: plan !== null,
    items: plan?.items ?? [],
    title: plan?.title ?? '',
    emoji: plan?.emoji ?? '📅',
    category: plan?.category ?? 'mixed',
    toggleItem, addItem, updateItem, removeItem,
  }
}
