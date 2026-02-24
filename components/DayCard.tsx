'use client'

import { DayItem, CATEGORY_META, ActivityCategory } from '@/types'
import { useDayState } from '@/lib/useCheckState'
import { ClimbLogger } from './ClimbLogger'

const ACCENT_BY_TYPE: Record<string, string> = {
  strength: '#C8F135', movement: '#4EA8FF', recovery: '#A78BFA',
  event: '#F5A623', mixed: '#C8F135', rest: '#888888',
  climb: '#4EA8FF', cardio: '#FF4E4E', optional: '#C8F135',
}
const COLOR_MAP: Record<string, string> = {
  accent: '#C8F135', info: '#4EA8FF', warn: '#F5A623', crit: '#FF4E4E', ash: '#888888',
}

// ─── Item badge (sets, duration, km…) ────────────────────────────────────────

function ItemBadge({ item, color }: { item: DayItem; color: string }) {
  const isModified = !!item.coach_note
  const c = isModified ? '#F5A623' : color
  const bg = `${c}22`

  const parts = [
    item.sets,
    item.weight,
    item.duration_min && `${item.duration_min} min`,
    item.km && `${item.km} km`,
    item.elevation_m && `D+${item.elevation_m}m`,
  ].filter(Boolean).join(' · ')

  if (!parts) return null
  return (
    <span className="ml-2 text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: bg, color: c }}>
      {parts}{isModified && ' 🤖'}
    </span>
  )
}

// ─── Item row ────────────────────────────────────────────────────────────────

function ItemCheckRow({ item, accentColor, onToggle }: {
  item: DayItem; accentColor: string; onToggle: () => void
}) {
  const isChecked  = !!item.checked
  const isSkipped  = !!item.skipped
  const isModified = !!item.coach_note
  const label = item.label || item.activity

  if (isSkipped) {
    return (
      <div className="flex items-start gap-3 px-2.5 py-2 opacity-40">
        <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-crit text-xs">✕</span>
        <div>
          <div className="text-sm font-mono line-through text-ash">{label}</div>
          <div className="text-crit text-xs font-mono">Supprimé par le Coach</div>
        </div>
      </div>
    )
  }

  return (
    <label className={`flex items-start gap-3 px-2.5 py-2.5 cursor-pointer rounded transition-colors ${
      isChecked ? 'bg-carbon bg-opacity-50' : 'hover:bg-steel hover:bg-opacity-40'
    } ${isModified ? 'border-l-2 border-warn border-opacity-60' : ''}`}>
      <input type="checkbox" className="check-box mt-0.5 flex-shrink-0" checked={isChecked} onChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-mono transition-all ${isChecked ? 'line-through text-ash' : 'text-chalk'}`}>
          {label}
          <ItemBadge item={item} color={accentColor} />
        </div>
        {item.notes && !item.coach_note && (
          <div className="text-ash text-xs mt-0.5">{item.notes}</div>
        )}
        {item.coach_note && (
          <div className="text-warn text-xs font-mono mt-0.5">Coach : {item.coach_note}</div>
        )}
      </div>
    </label>
  )
}

// ─── Outdoor/hike summary block ───────────────────────────────────────────────

function OutdoorBlock({ item }: { item: DayItem }) {
  return (
    <div className="bg-carbon border border-zinc rounded px-3 py-2.5 text-xs font-mono space-y-1">
      <div className="flex items-center gap-2 text-chalk text-sm font-bold mb-1">
        <span>🏔</span>{item.label || item.activity}
      </div>
      {item.km && <div className="text-ash">Distance : <span className="text-warn">{item.km} km</span></div>}
      {item.elevation_m && <div className="text-ash">Dénivelé+ : <span className="text-accent">{item.elevation_m} m</span></div>}
      {item.duration_min && <div className="text-ash">Durée : <span className="text-info">{Math.floor(item.duration_min/60)}h{String(item.duration_min%60).padStart(2,'0')}</span></div>}
      {item.notes && <div className="text-ghost italic mt-1">{item.notes}</div>}
    </div>
  )
}

// ─── Main DayCard ─────────────────────────────────────────────────────────────

interface Props {
  dateKey: string
  title: string
  emoji: string
  effectiveType: string
  items: DayItem[]
  defaultColor?: string
  isCustomized: boolean
  onOpenEditor: () => void
}

export function DayCard({ dateKey, title, emoji, effectiveType, items, defaultColor, isCustomized, onOpenEditor }: Props) {
  const { state, loading, saving, toggleItem, setPainLevel, setNotes } = useDayState(dateKey)

  const accentColor = defaultColor
    ? (COLOR_MAP[defaultColor] ?? ACCENT_BY_TYPE[effectiveType] ?? '#C8F135')
    : (ACCENT_BY_TYPE[effectiveType] ?? '#C8F135')

  // Merge checked/skipped state from useCheckState into items
  const resolvedItems = items.map(item => ({
    ...item,
    checked: !!state.exercises[item.id],
    skipped: item.skipped || !!state.skipped?.[item.id],
    coach_note: item.coach_note || state.modifications?.[item.id]?.note,
  }))

  // Progress: only non-skipped, non-outdoor items are checkable
  const checkable = resolvedItems.filter(i => !i.skipped && !(i.km || i.elevation_m))
  const completed = checkable.filter(i => i.checked).length
  const total     = checkable.length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  // Feature visibility
  const hasClimbing = items.some(i =>
    i.activity?.toLowerCase().includes('escalade') ||
    i.activity?.toLowerCase().includes('climb')
  )
  const showPain = effectiveType === 'strength' || effectiveType === 'movement' ||
    effectiveType === 'climb' || hasClimbing

  const skippedCount  = resolvedItems.filter(i => i.skipped).length
  const modifiedCount = Object.keys(state.modifications ?? {}).length

  return (
    <div className="border bg-slate" style={{ borderColor: `${accentColor}33` }}>
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b" style={{ borderColor: `${accentColor}22` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xl">{emoji}</span>
              <span className="text-xs tracking-[0.2em] uppercase font-mono" style={{ color: accentColor }}>
                {effectiveType}
              </span>
              {isCustomized && (
                <span className="text-xs font-mono text-ghost border border-zinc px-1.5 py-0.5">personnalisé</span>
              )}
              {saving && <span className="text-zinc text-xs font-mono animate-pulse">sauvegarde…</span>}
            </div>
            <div className="font-display text-2xl font-bold tracking-tight text-chalk truncate">{title}</div>

            {(skippedCount > 0 || modifiedCount > 0) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skippedCount > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 border border-crit border-opacity-40 text-crit bg-crit bg-opacity-5">
                    🤖 {skippedCount} supprimé{skippedCount > 1 ? 's' : ''}
                  </span>
                )}
                {modifiedCount > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 border border-warn border-opacity-40 text-warn bg-warn bg-opacity-5">
                    🤖 {modifiedCount} allégé{modifiedCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            {total > 0 && (
              <>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#2A2A2A" strokeWidth="3" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke={accentColor} strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-sm font-bold text-chalk">{pct}%</span>
                  </div>
                </div>
                <span className="text-ash text-xs">{completed}/{total}</span>
              </>
            )}
            <button onClick={onOpenEditor}
              className="text-xs font-mono text-ash border border-zinc px-2 py-1 hover:border-accent hover:text-accent transition-all">
              ✎ Éditer
            </button>
          </div>
        </div>
        {total > 0 && (
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${pct}%`, background: accentColor }} />
          </div>
        )}
      </div>

      {/* ── Items ── */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-9 bg-steel animate-pulse rounded" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-ash text-sm font-mono mb-3">Aucune activité planifiée</div>
            <button onClick={onOpenEditor}
              className="text-xs font-mono text-accent border border-accent px-3 py-1.5 hover:bg-accent hover:text-carbon transition-all">
              + Personnaliser cette journée
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {resolvedItems.map(item => {
              // Outdoor activities with km/elevation get a summary block
              const isOutdoor = !!(item.km || item.elevation_m)
              if (isOutdoor) return <OutdoorBlock key={item.id} item={item} />
              return (
                <ItemCheckRow key={item.id} item={item} accentColor={accentColor}
                  onToggle={() => toggleItem(item.id)} />
              )
            })}
          </div>
        )}

        {/* Climb logger — only when activity looks like climbing */}
        {hasClimbing && <ClimbLogger dateKey={dateKey} />}

        {/* Pain tracker */}
        {showPain && (
          <div className="border-t border-steel pt-4">
            <div className="text-xs text-ash tracking-[0.2em] uppercase mb-3 font-mono">Douleur bras (0–10)</div>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 11 }, (_, i) => (
                <button key={i} onClick={() => setPainLevel(state.painLevel === i ? null : i)}
                  className={`w-8 h-8 text-xs font-mono font-bold border transition-all ${
                    state.painLevel === i
                      ? i <= 3 ? 'bg-accent border-accent text-carbon'
                        : i <= 6 ? 'bg-warn border-warn text-carbon'
                        : 'bg-crit border-crit text-chalk'
                      : 'border-zinc text-ash hover:border-ghost'
                  }`}>
                  {i}
                </button>
              ))}
            </div>
            {state.painLevel !== null && state.painLevel >= 5 && (
              <div className="text-warn text-xs mt-2 font-mono">⚠ Douleur ≥5 — réduire ou arrêter</div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="border-t border-steel pt-4">
          <div className="text-xs text-ash tracking-[0.2em] uppercase mb-2 font-mono">Notes de séance</div>
          <textarea value={state.notes} onChange={e => setNotes(e.target.value)}
            placeholder="Comment ça s'est passé ? PRs, observations, douleurs…"
            className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 resize-none focus:outline-none focus:border-ghost placeholder-zinc transition-colors"
            rows={3} />
        </div>
      </div>
    </div>
  )
}
