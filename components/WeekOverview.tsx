'use client'

import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DayPlan } from '@/types'
import { useDayState } from '@/lib/useCheckState'

const colorMap: Record<string, string> = {
  accent: '#C8F135',
  info: '#4EA8FF',
  warn: '#F5A623',
  crit: '#FF4E4E',
  ash: '#888888',
}

function DayMiniCard({ day, dayPlan, onClick }: { day: Date; dayPlan: DayPlan; onClick: () => void }) {
  const dateKey = format(day, 'yyyy-MM-dd')
  const { state } = useDayState(dateKey)

  const allExercises = dayPlan.sections.flatMap(s => s.exercises)
  const completed = allExercises.filter(e => state.exercises[e.id]).length
  const total = allExercises.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const accentColor = colorMap[dayPlan.color] || '#C8F135'
  const today = isToday(day)

  return (
    <button
      onClick={onClick}
      className="day-card text-left border bg-slate p-4 w-full hover:bg-steel transition-all"
      style={{ borderColor: today ? accentColor : `${accentColor}33` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">{dayPlan.emoji}</span>
            {today && (
              <span className="text-xs font-mono font-bold px-1.5 py-0.5"
                style={{ background: `${accentColor}22`, color: accentColor }}>
                AUJOURD'HUI
              </span>
            )}
          </div>
          <div className="font-display font-bold text-lg tracking-tight text-chalk">
            {format(day, 'EEE', { locale: fr }).toUpperCase()}
          </div>
          <div className="text-ash text-xs font-mono">{format(day, 'd MMM', { locale: fr })}</div>
        </div>
        <div className="text-right" style={{ color: pct === 100 ? accentColor : pct > 0 ? '#F5A623' : '#3A3A3A' }}>
          <div className="font-mono font-bold text-lg">{pct}%</div>
          <div className="text-xs">{completed}/{total}</div>
        </div>
      </div>
      <div className="text-chalk text-sm font-mono mb-3 line-clamp-1">{dayPlan.title}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: accentColor }} />
      </div>
      {state.painLevel !== null && (
        <div className={`text-xs mt-2 font-mono ${
          state.painLevel >= 7 ? 'text-crit' : state.painLevel >= 4 ? 'text-warn' : 'text-ghost'
        }`}>
          Douleur : {state.painLevel}/10
        </div>
      )}
    </button>
  )
}

interface Props {
  weekDays: Date[]
  weekPlan: DayPlan[]
  onSelectDay: (day: Date) => void
}

export function WeekOverview({ weekDays, weekPlan, onSelectDay }: Props) {
  return (
    <div>
      <div className="font-display text-4xl font-black tracking-tight text-chalk mb-2">CETTE SEMAINE</div>
      <div className="text-ash text-sm font-mono mb-6">
        {format(weekDays[0], 'd MMM', { locale: fr })} — {format(weekDays[6], 'd MMM yyyy', { locale: fr })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {weekDays.map((day, i) => (
          <DayMiniCard key={i} day={day} dayPlan={weekPlan[i]} onClick={() => onSelectDay(day)} />
        ))}
      </div>

      <div className="mt-8 border border-steel bg-slate p-5">
        <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-4">Résumé du programme</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-mono">
          <div><div className="text-info font-bold text-lg">2×</div><div className="text-ash text-xs">Séances escalade</div></div>
          <div><div className="text-crit font-bold text-lg">2×</div><div className="text-ash text-xs">Séances force</div></div>
          <div><div className="text-warn font-bold text-lg">1×</div><div className="text-ash text-xs">Récupération active</div></div>
          <div><div className="text-ghost font-bold text-lg">2×</div><div className="text-ash text-xs">Jours de repos</div></div>
        </div>
        <div className="mt-4 text-xs text-ash font-mono border-t border-steel pt-4">
          Objectif protéines : <span className="text-accent font-bold">150g/jour</span> ·
          Décharge toutes les 4 semaines (−30%) ·
          Pas de campus board avant 6–9 mois
        </div>
      </div>
    </div>
  )
}
