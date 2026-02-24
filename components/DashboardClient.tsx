'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { signOut } from 'next-auth/react'
import { weekPlan } from '@/lib/planData'
import { useDayPlan } from '@/lib/useDayPlan'
import { useDayState } from '@/lib/useCheckState'
import { DayCard } from './DayCard'
import { DayEditor } from './DayEditor'
import { NutritionPanel } from './NutritionPanel'
import { DailyWellbeing } from './DailyWellbeing'
import { WeekOverview } from './WeekOverview'
import { ProgressDashboard } from './ProgressDashboard'
import { AIReview } from './AIReview'
import { CoachChat } from './CoachChat'
import { AdminPanel } from './AdminPanel'
import { LogoutIcon } from './Icons'
import { CustomDayPlan } from '@/types'

type MainView = 'jour' | 'semaine' | 'progres' | 'coach' | 'admin'

// ─── Day view — has access to useDayPlan and useDayState ─────────────────────

function DayView({ dateKey, selectedDate }: { dateKey: string; selectedDate: Date }) {
  const [dayTab, setDayTab] = useState<'sport' | 'nutrition' | 'bienetre'>('sport')
  const [editorOpen, setEditorOpen] = useState(false)

  const {
    customPlan, isCustomized, loading, saving,
    defaultTemplate,
    effectiveItems, effectiveTitle, effectiveEmoji, effectiveType,
    initCustomPlan, toggleItem, addItem, updateItem, removeItem, moveItem,
    updateMeta, resetToDefault, replacePlan, applyCoachPatch,
  } = useDayPlan(dateKey)

  const { state, applyPatch: applySessionPatch } = useDayState(dateKey)

  const isClimbDay = effectiveType === 'climb' || effectiveItems.some(i => i.activity?.toLowerCase().includes('escalade') || i.activity?.toLowerCase().includes('climb'))

  // When editor opens and no custom plan yet, init from template
  const handleOpenEditor = useCallback(() => {
    if (!isCustomized && !loading) initCustomPlan()
    setEditorOpen(true)
  }, [isCustomized, loading, initCustomPlan])

  // Coach: apply patch (skip/modify existing items)
  const handleApplyPatch = useCallback((patch: any) => {
    applyCoachPatch(patch)       // updates item skipped/coach_note in useDayPlan
    applySessionPatch(patch)     // also updates useCheckState for legacy support
    setDayTab('sport')
  }, [applyCoachPatch, applySessionPatch])

  // Coach: replace entire day with generated plan
  const handleApplyGeneratedDay = useCallback((day: CustomDayPlan) => {
    replacePlan(day)
    setDayTab('sport')
  }, [replacePlan])

  return (
    <>
      <div className="space-y-5">
        {/* Date header */}
        <div className="flex items-baseline gap-3">
          <div className="font-display text-5xl font-black tracking-tight text-chalk">
            {isToday(selectedDate) ? "AUJOURD'HUI" : format(selectedDate, 'EEEE', { locale: fr }).toUpperCase()}
          </div>
          <div className="text-ash font-mono text-sm">{format(selectedDate, 'd MMMM yyyy', { locale: fr })}</div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-steel">
          {[
            { key: 'sport' as const,     label: '💪 Sport' },
            { key: 'nutrition' as const, label: '🥗 Nutrition' },
            { key: 'bienetre' as const,  label: '🌡 Bien-être' },
          ].map(t => (
            <button key={t.key} onClick={() => setDayTab(t.key)}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-all ${dayTab === t.key ? 'text-accent border-b-2 border-accent' : 'text-ash hover:text-chalk'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {dayTab === 'sport' && (
          <DayCard
            dateKey={dateKey}
            title={effectiveTitle}
            emoji={effectiveEmoji}
            effectiveType={effectiveType}
            items={effectiveItems}
            defaultColor={defaultTemplate?.color}
            isCustomized={isCustomized}
            onOpenEditor={handleOpenEditor}
          />
        )}
        {dayTab === 'nutrition' && <NutritionPanel dateKey={dateKey} isClimbDay={isClimbDay} />}
        {dayTab === 'bienetre' && <DailyWellbeing dateKey={dateKey} />}
      </div>

      {/* Day editor panel */}
      <DayEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        dateKey={dateKey}
        title={effectiveTitle}
        emoji={effectiveEmoji}
        items={effectiveItems}
        isCustomized={isCustomized}
        onAddItem={item => { if (!isCustomized) initCustomPlan(); addItem(item) }}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
        onMoveItem={moveItem}
        onUpdateMeta={updateMeta}
        onResetToDefault={() => { resetToDefault(); setEditorOpen(false) }}
        onInitCustomPlan={() => initCustomPlan()}
      />

      {/* Floating coach */}
      <CoachChat
        dateKey={dateKey}
        currentDayPlan={{ title: effectiveTitle, type: effectiveType }}
        currentItems={effectiveItems}
        onApplyPatch={handleApplyPatch}
        onApplyGeneratedDay={handleApplyGeneratedDay}
      />
    </>
  )
}

// ─── Week strip mini cards ────────────────────────────────────────────────────

function WeekDayButton({ day, dayIndex, isSelected, onClick }: {
  day: Date; dayIndex: number; isSelected: boolean; onClick: () => void
}) {
  // Try to get custom plan emoji if exists — just use default template for strip
  const defaultPlan = weekPlan[dayIndex]
  const isTodayDay = isToday(day)

  return (
    <button onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2 px-1 border transition-all ${isSelected ? 'border-accent bg-accent bg-opacity-10' : 'border-transparent hover:border-steel'}`}>
      <span className="text-xs text-ash tracking-wide hidden sm:block">{format(day, 'EEE', { locale: fr }).toUpperCase()}</span>
      <span className="text-xs text-ash tracking-wide sm:hidden">{format(day, 'EEEEE', { locale: fr }).toUpperCase()}</span>
      <span className={`text-sm font-mono font-bold mt-0.5 ${isTodayDay ? 'text-accent' : isSelected ? 'text-chalk' : 'text-ghost'}`}>{format(day, 'd')}</span>
      <span className="text-base mt-0.5">{defaultPlan?.emoji ?? '📅'}</span>
    </button>
  )
}

// ─── Root dashboard ───────────────────────────────────────────────────────────

export function DashboardClient() {
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<MainView>('jour')

  useEffect(() => { setSelectedDate(new Date()); setMounted(true) }, [])

  if (!mounted || !selectedDate) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="font-display text-4xl font-black tracking-tight text-chalk animate-pulse text-center leading-tight">KEEP<br />PUSHING !</div>
      </div>
    )
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dateKey = format(selectedDate, 'yyyy-MM-dd')

  const navItems = [
    { key: 'jour' as const,    label: "Aujourd'hui", short: 'Jour' },
    { key: 'semaine' as const, label: 'Semaine',     short: 'Sem.' },
    { key: 'progres' as const, label: 'Progrès',     short: 'Stats' },
    { key: 'coach' as const,   label: 'Coach IA',    short: 'IA' },
    { key: 'admin' as const,   label: 'Admin',       short: '⚙' },
  ]

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-steel sticky top-0 z-30 bg-carbon bg-opacity-95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-display text-2xl font-black tracking-tighter text-chalk">KEEP PUSHING !</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex border border-steel">
              {navItems.map(item => (
                <button key={item.key} onClick={() => setView(item.key)}
                  className={`px-2 sm:px-3 py-1.5 text-xs tracking-wider uppercase font-mono transition-all ${
                    view === item.key
                      ? item.key === 'admin' ? 'bg-crit text-chalk font-bold' : 'bg-accent text-carbon font-bold'
                      : item.key === 'admin' ? 'text-crit hover:text-chalk hover:bg-crit hover:bg-opacity-20' : 'text-ash hover:text-chalk'
                  }`}>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
                </button>
              ))}
            </nav>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-ash hover:text-crit transition-colors p-1.5" title="Déconnexion">
              <LogoutIcon />
            </button>
          </div>
        </div>

        {(view === 'jour' || view === 'semaine') && (          <div className="max-w-5xl mx-auto px-4 pb-3">
            <div className="flex gap-1 sm:gap-2">
              {weekDays.map((day, i) => (
                <WeekDayButton key={i} day={day} dayIndex={i} isSelected={isSameDay(day, selectedDate)}
                  onClick={() => { setSelectedDate(day); setView('jour') }} />
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'jour' && <DayView dateKey={dateKey} selectedDate={selectedDate} />}

        {view === 'semaine' && (
          <WeekOverview weekDays={weekDays} weekPlan={weekPlan}
            onSelectDay={d => { setSelectedDate(d); setView('jour') }} />
        )}

        {view === 'progres' && (
          <div className="space-y-6">
            <div><div className="font-display text-5xl font-black tracking-tight text-chalk mb-1">PROGRÈS</div><div className="text-ash font-mono text-sm">Tes métriques dans le temps</div></div>
            <ProgressDashboard />
          </div>
        )}

        {view === 'coach' && (
          <div className="space-y-6">
            <div><div className="font-display text-5xl font-black tracking-tight text-chalk mb-1">COACH IA</div><div className="text-ash font-mono text-sm">Bilan hebdomadaire par Gemini 2.5 Flash</div></div>
            <AIReview />
          </div>
        )}

        {view === 'admin' && <AdminPanel />}
      </main>
    </div>
  )
}
