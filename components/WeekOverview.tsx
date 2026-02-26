'use client'

import { useState, useEffect } from 'react'
import { format, isToday, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DayPlanSummary {
  title: string
  emoji: string
  category: string
  items: any[]
}

interface Props {
  weekDays: Date[]
  onSelectDay: (d: Date) => void
}

const CAT_COLOR: Record<string, string> = {
  strength: '#C8F135', movement: '#4EA8FF', recovery: '#A78BFA',
  event: '#F5A623', mixed: '#64D8FF', rest: '#888',
}

export function WeekOverview({ weekDays, onSelectDay }: Props) {
  const [plans, setPlans] = useState<Record<string, DayPlanSummary>>({})
  const [loading, setLoading] = useState(true)

  // Use the formatted date strings directly as deps — no Date object instability
  const fromKey = weekDays.length ? format(weekDays[0], 'yyyy-MM-dd') : ''
  const toKey   = weekDays.length ? format(weekDays[6], 'yyyy-MM-dd') : ''

  useEffect(() => {
    if (!fromKey || !toKey) return
    setLoading(true)
    setPlans({})
    fetch(`/api/day-plan/week?from=${fromKey}&to=${toKey}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          // Normalise all keys to yyyy-MM-dd regardless of what the API returns
          const normalised: Record<string, DayPlanSummary> = {}
          Object.entries(data).forEach(([k, v]: [string, any]) => {
            const key = k.split('T')[0]  // strip time if present
            normalised[key] = v
          })
          setPlans(normalised)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fromKey, toKey])

  return (
    <div className="space-y-6">
      <div>
        <div className="font-display text-5xl font-black tracking-tight text-chalk mb-1">SEMAINE</div>
        <div className="text-ash font-mono text-sm">
          {fromKey && toKey
            ? `${format(weekDays[0], 'd MMM', { locale: fr })} — ${format(weekDays[6], 'd MMM yyyy', { locale: fr })}`
            : ''}
        </div>
      </div>

      <div className="space-y-2">
        {weekDays.map((day) => {
          const dk = format(day, 'yyyy-MM-dd')
          const plan = plans[dk]
          const todayDay = isToday(day)
          const past = isPast(day) && !todayDay
          const color = plan ? (CAT_COLOR[plan.category] ?? '#888') : '#3A3A3A'
          const total = plan ? plan.items.length : 0
          const done = plan ? plan.items.filter((i: any) => i.checked && !i.skipped).length : 0
          const progress = total > 0 ? Math.round((done / total) * 100) : null

          return (
            <button
              key={dk}
              onClick={() => onSelectDay(day)}
              className={`w-full text-left border transition-all p-4 group ${
                todayDay ? 'border-accent bg-accent bg-opacity-5' : 'border-steel bg-slate hover:border-ghost'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Day label */}
                <div className="w-28 flex-shrink-0">
                  <div className={`text-xs font-mono uppercase tracking-wider ${todayDay ? 'text-accent' : 'text-ash'}`}>
                    {format(day, 'EEEE', { locale: fr })}
                    {todayDay && <span className="ml-1">←</span>}
                  </div>
                  <div className={`text-lg font-mono font-bold ${todayDay ? 'text-accent' : past ? 'text-ghost' : 'text-chalk'}`}>
                    {format(day, 'd MMM', { locale: fr })}
                  </div>
                </div>

                {/* Emoji */}
                <div className="text-2xl flex-shrink-0 w-8">
                  {loading ? <span className="text-zinc">·</span> : (plan ? plan.emoji : '—')}
                </div>

                {/* Plan info */}
                <div className="flex-1 min-w-0">
                  {plan ? (
                    <>
                      <div className="text-chalk text-sm font-mono font-bold truncate">{plan.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs font-mono px-1.5 py-0.5"
                          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                          {plan.category}
                        </span>
                        {total > 0 && (
                          <span className="text-xs font-mono text-ash">{done}/{total} tâches</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-ash text-sm font-mono italic">
                      {loading ? 'Chargement…' : 'Vide — demande au coach de planifier'}
                    </div>
                  )}
                </div>

                {/* Progress ring + arrow */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {progress !== null && (
                    <div className="w-10 h-10 relative">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#2A2A2A" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                          stroke={progress === 100 ? '#C8F135' : color}
                          strokeDasharray={`${progress * 0.942} 100`}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold"
                        style={{ color: progress === 100 ? '#C8F135' : '#888' }}>
                        {progress}%
                      </div>
                    </div>
                  )}
                  <span className="text-ash group-hover:text-accent transition-colors text-sm">→</span>
                </div>
              </div>

              {total > 0 && (
                <div className="mt-3 h-0.5 bg-steel bg-opacity-50">
                  <div className="h-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: progress === 100 ? '#C8F135' : color }} />
                </div>
              )}
            </button>
          )
        })}
      </div>

    </div>
  )
}