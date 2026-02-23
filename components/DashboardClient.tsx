'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { signOut } from 'next-auth/react'
import { weekPlan } from '@/lib/planData'
import { useDayState } from '@/lib/useCheckState'
import { DayCard } from './DayCard'
import { NutritionPanel } from './NutritionPanel'
import { DailyWellbeing } from './DailyWellbeing'
import { WeekOverview } from './WeekOverview'
import { ProgressDashboard } from './ProgressDashboard'
import { AIReview } from './AIReview'
import { CoachChat } from './CoachChat'
import { LogoutIcon } from './Icons'

type MainView = 'jour' | 'semaine' | 'progres' | 'coach'

// Inner component that has access to useDayState for the current date
function DayView({
  dateKey,
  selectedDate,
  currentDayPlan,
}: {
  dateKey: string
  selectedDate: Date
  currentDayPlan: ReturnType<typeof weekPlan.find>
}) {
  const [dayTab, setDayTab] = useState<'sport' | 'nutrition' | 'bienetre'>('sport')
  const { state, applyPatch } = useDayState(dateKey)
  const isClimbDay = currentDayPlan?.type === 'climb'

  const handleApplyPatch = useCallback((patch: any) => {
    applyPatch(patch)
    // Switch to sport tab so user sees the change
    setDayTab('sport')
  }, [applyPatch])

  return (
    <>
      <div className="space-y-5">
        {/* Date header */}
        <div className="flex items-baseline gap-3">
          <div className="font-display text-5xl font-black tracking-tight text-chalk">
            {isToday(selectedDate)
              ? "AUJOURD'HUI"
              : format(selectedDate, 'EEEE', { locale: fr }).toUpperCase()}
          </div>
          <div className="text-ash font-mono text-sm">
            {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex border-b border-steel">
          {[
            { key: 'sport' as const, label: '💪 Sport' },
            { key: 'nutrition' as const, label: '🥗 Nutrition' },
            { key: 'bienetre' as const, label: '🌡 Bien-être' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setDayTab(t.key)}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-all ${
                dayTab === t.key
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-ash hover:text-chalk'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {dayTab === 'sport' && currentDayPlan && (
          <DayCard dayPlan={currentDayPlan} dateKey={dateKey} />
        )}

        {dayTab === 'nutrition' && (
          <NutritionPanel dateKey={dateKey} isClimbDay={isClimbDay} />
        )}

        {dayTab === 'bienetre' && (
          <DailyWellbeing dateKey={dateKey} />
        )}
      </div>

      {/* Floating coach chat — always accessible on day view */}
      <CoachChat
        dateKey={dateKey}
        dayPlan={currentDayPlan}
        currentExercises={state.exercises}
        onApplyPatch={handleApplyPatch}
      />
    </>
  )
}

// ─── Main shell ────────────────────────────────────────────────────────────────

export function DashboardClient() {
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<MainView>('jour')

  useEffect(() => {
    setSelectedDate(new Date())
    setMounted(true)
  }, [])

  if (!mounted || !selectedDate) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="font-display text-4xl font-black tracking-tight text-chalk animate-pulse leading-tight text-center">
          KEEP<br />PUSHING !
        </div>
      </div>
    )
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase() as any
  const currentDayPlan = weekPlan.find(d => d.key === dayOfWeek)
  const dateKey = format(selectedDate, 'yyyy-MM-dd')

  const navItems: { key: MainView; label: string; short: string }[] = [
    { key: 'jour', label: "Aujourd'hui", short: 'Jour' },
    { key: 'semaine', label: 'Semaine', short: 'Sem.' },
    { key: 'progres', label: 'Progrès', short: 'Stats' },
    { key: 'coach', label: 'Coach IA', short: 'IA' },
  ]

  return (
    <div className="min-h-screen grid-bg">
      {/* ── Header ── */}
      <header className="border-b border-steel sticky top-0 z-50 bg-carbon bg-opacity-95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-display text-2xl font-black tracking-tighter text-chalk leading-none">
            KEEP PUSHING !
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex border border-steel">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`px-2 sm:px-3 py-1.5 text-xs tracking-wider uppercase font-mono transition-all ${
                    view === item.key ? 'bg-accent text-carbon font-bold' : 'text-ash hover:text-chalk'
                  }`}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
                </button>
              ))}
            </nav>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-ash hover:text-crit transition-colors p-1.5"
              title="Déconnexion"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Week strip */}
        {(view === 'jour' || view === 'semaine') && (
          <div className="max-w-5xl mx-auto px-4 pb-3">
            <div className="flex gap-1 sm:gap-2">
              {weekDays.map((day, i) => {
                const dayPlan = weekPlan[i]
                const isSelected = isSameDay(day, selectedDate)
                const isTodayDay = isToday(day)
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(day); setView('jour') }}
                    className={`flex-1 flex flex-col items-center py-2 px-1 border transition-all ${
                      isSelected ? 'border-accent bg-accent bg-opacity-10' : 'border-transparent hover:border-steel'
                    }`}
                  >
                    <span className="text-xs text-ash tracking-wide hidden sm:block">
                      {format(day, 'EEE', { locale: fr }).toUpperCase()}
                    </span>
                    <span className="text-xs text-ash tracking-wide sm:hidden">
                      {format(day, 'EEEEE', { locale: fr }).toUpperCase()}
                    </span>
                    <span className={`text-sm font-mono font-bold mt-0.5 ${
                      isTodayDay ? 'text-accent' : isSelected ? 'text-chalk' : 'text-ghost'
                    }`}>{format(day, 'd')}</span>
                    <span className="text-base mt-0.5">{dayPlan?.emoji}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">

        {view === 'semaine' && (
          <WeekOverview
            weekDays={weekDays}
            weekPlan={weekPlan}
            onSelectDay={(d) => { setSelectedDate(d); setView('jour') }}
          />
        )}

        {view === 'jour' && (
          <DayView
            dateKey={dateKey}
            selectedDate={selectedDate}
            currentDayPlan={currentDayPlan}
          />
        )}

        {view === 'progres' && (
          <div className="space-y-6">
            <div>
              <div className="font-display text-5xl font-black tracking-tight text-chalk mb-1">PROGRÈS</div>
              <div className="text-ash font-mono text-sm">Tes métriques dans le temps</div>
            </div>
            <ProgressDashboard />
          </div>
        )}

        {view === 'coach' && (
          <div className="space-y-6">
            <div>
              <div className="font-display text-5xl font-black tracking-tight text-chalk mb-1">COACH IA</div>
              <div className="text-ash font-mono text-sm">Bilan hebdomadaire par Google Gemini</div>
            </div>
            <AIReview />
          </div>
        )}

      </main>
    </div>
  )
}
