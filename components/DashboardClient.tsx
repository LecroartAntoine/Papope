'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, addDays, subDays, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { signOut } from 'next-auth/react'
import { useDayPlan } from '@/lib/useDayPlan'
import { DayCard } from './DayCard'
import { NutritionPanel } from './NutritionPanel'
import { DailyWellbeing } from './DailyWellbeing'
import { WeekOverview } from './WeekOverview'
import { ProgressDashboard } from './ProgressDashboard'
import { CoachChat } from './CoachChat'
import { AdminPanel } from './AdminPanel'
import { LogoutIcon } from './Icons'

type View = 'jour' | 'semaine' | 'stats' | 'admin'

function DayView({ dateKey, selectedDate }: { dateKey: string; selectedDate: Date }) {
  const [nutritionKey, setNutritionKey] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const { loading, hasPlan, items, title, emoji, category, toggleItem } = useDayPlan(dateKey, refreshKey)
  const isClimbDay = items.some(i =>
    i.activity?.toLowerCase().includes('escalade') || i.activity?.toLowerCase().includes('climb')
  )
  const handleRefreshDay = useCallback(() => setRefreshKey(k => k + 1), [])
  const handleSupplementsUpdated = useCallback(() => setNutritionKey(k => k + 1), [])

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-baseline gap-3 flex-wrap">
          <div className="font-display text-5xl font-black tracking-tight text-chalk">
            {isToday(selectedDate) ? "AUJOURD'HUI" : format(selectedDate, 'EEEE', { locale: fr }).toUpperCase()}
          </div>
          <div className="text-ash font-mono text-sm">{format(selectedDate, 'd MMMM yyyy', { locale: fr })}</div>
        </div>
        <section>
          <DayCard dateKey={dateKey} title={title} emoji={emoji} category={category}
            items={items} hasPlan={hasPlan} loading={loading} onToggleItem={toggleItem} />
        </section>
        <section>
          <div className="text-ash font-mono text-xs uppercase tracking-[0.2em] mb-3">🥗 Nutrition</div>
          <NutritionPanel key={nutritionKey} dateKey={dateKey} isClimbDay={isClimbDay} />
        </section>
        <section>
          <div className="text-ash font-mono text-xs uppercase tracking-[0.2em] mb-3">🌡 Bien-être & Récupération</div>
          <DailyWellbeing dateKey={dateKey} />
        </section>
      </div>
      <CoachChat dateKey={dateKey} currentItems={items} isClimbDay={isClimbDay}
        onRefreshDay={handleRefreshDay} onSupplementsUpdated={handleSupplementsUpdated} />
    </>
  )
}

function WeekDayBtn({ day, planEmoji, isSelected, onClick }: {
  day: Date; planEmoji?: string; isSelected: boolean; onClick: () => void
}) {
  const todayDay = isToday(day)
  return (
    <button onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2 px-1 border transition-all ${
        isSelected ? 'border-accent bg-accent bg-opacity-10' : 'border-transparent hover:border-steel'
      }`}>
      <span className="text-[10px] text-ash tracking-wide hidden sm:block">{format(day, 'EEE', { locale: fr }).toUpperCase()}</span>
      <span className="text-[10px] text-ash tracking-wide sm:hidden">{format(day, 'EEEEE', { locale: fr }).toUpperCase()}</span>
      <span className={`text-sm font-mono font-bold mt-0.5 ${todayDay ? 'text-accent' : isSelected ? 'text-chalk' : 'text-ghost'}`}>
        {format(day, 'd')}
      </span>
      <span className="text-sm mt-0.5">{planEmoji ?? '·'}</span>
    </button>
  )
}

export function DashboardClient() {
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<View>('jour')
  const [weekEmojis, setWeekEmojis] = useState<Record<string, string>>({})

  useEffect(() => { setSelectedDate(new Date()); setMounted(true) }, [])

  const weekStartKey = selectedDate
    ? format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') : ''

  useEffect(() => {
    if (!weekStartKey || !selectedDate) return
    const weekStartDate = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const from = weekStartKey
    const to = format(addDays(weekStartDate, 6), 'yyyy-MM-dd')
    fetch(`/api/day-plan/week?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          const emojis: Record<string, string> = {}
          Object.entries(data).forEach(([date, p]: [string, any]) => {
            if (p?.emoji) emojis[date.split('T')[0]] = p.emoji
          })
          setWeekEmojis(emojis)
        }
      }).catch(() => {})
  }, [weekStartKey])

  if (!mounted || !selectedDate) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="font-display text-4xl font-black tracking-tight text-chalk animate-pulse text-center leading-tight">
          KEEP<br />PUSHING !
        </div>
      </div>
    )
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dateKey   = format(selectedDate, 'yyyy-MM-dd')
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))

  const goToPrevWeek = () => setSelectedDate(d => subDays(d!, 7))
  const goToNextWeek = () => setSelectedDate(d => addDays(d!, 7))
  const goToToday    = () => setSelectedDate(new Date())

  const navItems: { key: View; label: string; short: string }[] = [
    { key: 'jour',    label: "Aujourd'hui", short: 'Jour'  },
    { key: 'semaine', label: 'Semaine',     short: 'Sem.'  },
    { key: 'stats',   label: 'Progrès',     short: 'Stats' },
    { key: 'admin',   label: 'Admin',       short: '⚙'    },
  ]

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-steel sticky top-0 z-30 bg-carbon bg-opacity-95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-display text-2xl font-black tracking-tighter text-chalk">KEEP PUSHING !</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex border border-steel">
              {navItems.map(item => (
                <button key={item.key} onClick={() => setView(item.key)}
                  className={`px-2 sm:px-3 py-1.5 text-xs tracking-wider uppercase font-mono transition-all ${
                    view === item.key
                      ? item.key === 'admin' ? 'bg-crit text-chalk font-bold' : 'bg-accent text-carbon font-bold'
                      : item.key === 'admin' ? 'text-crit hover:bg-crit hover:bg-opacity-20' : 'text-ash hover:text-chalk'
                  }`}>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
                </button>
              ))}
            </nav>
            <button onClick={() => signOut({ callbackUrl: '/keeppushing/login' })}
              className="text-ash hover:text-crit transition-colors p-1.5" title="Déconnexion">
              <LogoutIcon />
            </button>
          </div>
        </div>

        {(view === 'jour' || view === 'semaine') && (
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <div className="flex items-center gap-1">
              <button onClick={goToPrevWeek}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-ash hover:text-chalk hover:bg-steel transition-all font-mono text-base leading-none"
                title="Semaine précédente">‹</button>
              <div className="flex flex-1 gap-1">
                {weekDays.map((day, i) => (
                  <WeekDayBtn key={i} day={day}
                    planEmoji={weekEmojis[format(day, 'yyyy-MM-dd')]}
                    isSelected={isSameDay(day, selectedDate)}
                    onClick={() => { setSelectedDate(day); setView('jour') }} />
                ))}
              </div>
              <button onClick={goToNextWeek}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-ash hover:text-chalk hover:bg-steel transition-all font-mono text-base leading-none"
                title="Semaine suivante">›</button>
            </div>
            {!isCurrentWeek && (
              <div className="flex justify-center mt-1.5">
                <button onClick={goToToday}
                  className="text-[10px] font-mono text-ash border border-zinc px-2 py-0.5 hover:border-accent hover:text-accent transition-all">
                  ← aujourd'hui
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {view === 'jour'    && <DayView dateKey={dateKey} selectedDate={selectedDate} />}
        {view === 'semaine' && <WeekOverview weekDays={weekDays} onSelectDay={d => { setSelectedDate(d); setView('jour') }} />}
        {view === 'stats'   && (
          <div className="space-y-6">
            <div>
              <div className="font-display text-5xl font-black tracking-tight text-chalk mb-1">PROGRÈS</div>
              <div className="text-ash font-mono text-sm">Tes données dans le temps</div>
            </div>
            <ProgressDashboard />
          </div>
        )}
        {view === 'admin'   && <AdminPanel />}
      </main>
    </div>
  )
}
