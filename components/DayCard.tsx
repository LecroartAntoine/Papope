'use client'

import { DayPlan } from '@/types'
import { useDayState } from '@/lib/useCheckState'
import { LiftLogger } from './LiftLogger'
import { ClimbLogger } from './ClimbLogger'

const colorMap: Record<string, string> = {
  accent: '#C8F135',
  info: '#4EA8FF',
  warn: '#F5A623',
  crit: '#FF4E4E',
  ash: '#888888',
}

interface Props {
  dayPlan: DayPlan
  dateKey: string
}

export function DayCard({ dayPlan, dateKey }: Props) {
  const { state, loading, saving, toggleExercise, setPainLevel, setNotes } = useDayState(dateKey)

  const allExercises = dayPlan.sections.flatMap(s => s.exercises)
  // Skipped exercises don't count toward total
  const activeExercises = allExercises.filter(e => !state.skipped[e.id])
  const completed = activeExercises.filter(e => state.exercises[e.id]).length
  const total = activeExercises.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const accentColor = colorMap[dayPlan.color] || '#C8F135'

  const skippedCount = Object.values(state.skipped).filter(Boolean).length
  const modifiedCount = Object.keys(state.modifications).length

  return (
    <div className="day-card border bg-slate" style={{ borderColor: `${accentColor}33` }}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: `${accentColor}22` }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xl">{dayPlan.emoji}</span>
              <span className="text-xs tracking-[0.2em] uppercase font-mono" style={{ color: accentColor }}>
                {dayPlan.type === 'strength' ? 'force' :
                 dayPlan.type === 'climb' ? 'escalade' :
                 dayPlan.type === 'recovery' ? 'récupération' :
                 dayPlan.type === 'optional' ? 'optionnel' : 'repos'}
              </span>
              {saving && <span className="text-zinc text-xs font-mono animate-pulse">sauvegarde…</span>}
            </div>
            <div className="font-display text-2xl font-bold tracking-tight text-chalk">{dayPlan.title}</div>
            <div className="text-ash text-xs mt-1 font-mono">{dayPlan.subtitle}</div>

            {/* AI adaptation badge */}
            {(skippedCount > 0 || modifiedCount > 0) && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {skippedCount > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 border border-crit border-opacity-40 text-crit bg-crit bg-opacity-5">
                    🤖 {skippedCount} exercice{skippedCount > 1 ? 's' : ''} supprimé{skippedCount > 1 ? 's' : ''}
                  </span>
                )}
                {modifiedCount > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 border border-warn border-opacity-40 text-warn bg-warn bg-opacity-5">
                    🤖 {modifiedCount} exercice{modifiedCount > 1 ? 's' : ''} allégé{modifiedCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#2A2A2A" strokeWidth="3" />
                <circle
                  cx="28" cy="28" r="22" fill="none" stroke={accentColor} strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-sm font-bold text-chalk">{pct}%</span>
              </div>
            </div>
            <span className="text-ash text-xs mt-1">{completed}/{total}</span>
          </div>
        </div>
        <div className="progress-bar mt-3">
          <div className="progress-fill" style={{ width: `${pct}%`, background: accentColor }} />
        </div>
      </div>

      {/* Exercise sections */}
      <div className="p-5 space-y-5">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-9 bg-steel animate-pulse rounded" />)}
          </div>
        ) : (
          dayPlan.sections.map((section, si) => (
            <div key={si}>
              <div className="text-xs text-ash tracking-[0.2em] uppercase mb-3 font-mono">{section.title}</div>
              <div className="space-y-2">
                {section.exercises.map(exercise => {
                  const isSkipped = !!state.skipped[exercise.id]
                  const mod = state.modifications[exercise.id]
                  const isChecked = !!state.exercises[exercise.id]

                  // Display sets: AI modification takes priority
                  const displaySets = mod?.sets ?? exercise.sets

                  if (isSkipped) {
                    return (
                      <div
                        key={exercise.id}
                        className="flex items-start gap-3 p-2.5 rounded opacity-40 select-none"
                      >
                        <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-crit text-xs font-mono">✕</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono line-through text-ash">
                            {exercise.name}
                          </div>
                          <div className="text-crit text-xs font-mono mt-0.5">Supprimé par le Coach IA</div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <label
                      key={exercise.id}
                      className={`flex items-start gap-3 p-2.5 cursor-pointer rounded transition-colors ${
                        isChecked ? 'bg-carbon bg-opacity-50' : 'hover:bg-steel hover:bg-opacity-50'
                      } ${mod ? 'border-l-2 border-warn border-opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="check-box mt-0.5"
                        checked={isChecked}
                        onChange={() => toggleExercise(exercise.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-mono transition-all ${isChecked ? 'line-through text-ash' : 'text-chalk'}`}>
                          {exercise.name}
                          {displaySets && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded font-bold"
                              style={{
                                background: mod ? '#F5A62322' : `${accentColor}22`,
                                color: mod ? '#F5A623' : accentColor,
                              }}
                            >
                              {displaySets}
                            </span>
                          )}
                          {mod && <span className="ml-1 text-xs text-warn">🤖</span>}
                        </div>
                        {exercise.notes && !mod && (
                          <div className="text-ash text-xs mt-0.5">{exercise.notes}</div>
                        )}
                        {mod?.note && (
                          <div className="text-warn text-xs mt-0.5">Coach : {mod.note}</div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {dayPlan.type === 'strength' && <LiftLogger dateKey={dateKey} dayPlan={dayPlan} />}
        {dayPlan.type === 'climb' && <ClimbLogger dateKey={dateKey} />}

        {(dayPlan.type === 'climb' || dayPlan.type === 'strength') && (
          <div className="border-t border-steel pt-4">
            <div className="text-xs text-ash tracking-[0.2em] uppercase mb-3 font-mono">Douleur bras (0–10)</div>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPainLevel(state.painLevel === i ? null : i)}
                  className={`w-8 h-8 text-xs font-mono font-bold border transition-all ${
                    state.painLevel === i
                      ? i <= 3 ? 'bg-accent border-accent text-carbon'
                        : i <= 6 ? 'bg-warn border-warn text-carbon'
                        : 'bg-crit border-crit text-chalk'
                      : 'border-zinc text-ash hover:border-ghost'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            {state.painLevel !== null && state.painLevel >= 5 && (
              <div className="text-warn text-xs mt-2 font-mono">⚠ Douleur ≥5 — réduire l'intensité ou arrêter</div>
            )}
          </div>
        )}

        <div className="border-t border-steel pt-4">
          <div className="text-xs text-ash tracking-[0.2em] uppercase mb-2 font-mono">Notes de séance</div>
          <textarea
            value={state.notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Comment ça s'est passé ? Douleurs, PRs, observations..."
            className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 resize-none focus:outline-none focus:border-ghost placeholder-zinc transition-colors"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
