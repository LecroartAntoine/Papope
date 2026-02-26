'use client'

import { DayItem, CATEGORY_META } from '@/types'

const CAT_COLOR: Record<string, string> = {
  strength: '#C8F135',
  movement: '#4EA8FF',
  recovery: '#A78BFA',
  event: '#F5A623',
  mixed: '#64D8FF',
}

function ItemBadges({ item, color }: { item: DayItem; color: string }) {
  const parts = [
    item.sets,
    item.weight,
    item.duration_min != null && `${item.duration_min}min`,
    item.km != null && `${item.km}km`,
    item.elevation_m != null && `D+${item.elevation_m}m`,
  ].filter(Boolean)

  if (!parts.length) return null
  return (
    <span className="ml-2 text-xs px-1.5 py-0.5 font-mono"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {parts.join(' · ')}
    </span>
  )
}

function ItemRow({ item, color, onToggle }: { item: DayItem; color: string; onToggle: () => void }) {
  const label = item.label || item.activity

  if (item.skipped) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 opacity-40">
        <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-crit text-xs">✕</span>
        <div>
          <span className="text-sm font-mono line-through text-ash">{label}</span>
          {item.coach_note && <div className="text-xs font-mono text-crit mt-0.5">🤖 {item.coach_note}</div>}
        </div>
      </div>
    )
  }

  return (
    <label className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group ${
      item.checked ? 'bg-carbon bg-opacity-50' : 'hover:bg-steel hover:bg-opacity-20'
    }${item.coach_note ? ' border-l-2 border-warn border-opacity-40' : ''}`}>
      <input
        type="checkbox"
        className="check-box mt-0.5 flex-shrink-0"
        checked={!!item.checked}
        onChange={onToggle}
      />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-mono leading-snug flex items-center flex-wrap gap-0.5 transition-all ${
          item.checked ? 'line-through text-ash' : 'text-chalk'
        }`}>
          <span>{label}</span>
          <ItemBadges item={item} color={color} />
        </div>
        {item.notes && (
          <div className="text-xs text-ash font-mono mt-0.5 leading-snug">{item.notes}</div>
        )}
        {item.coach_note && (
          <div className="text-xs text-warn font-mono mt-0.5">🤖 {item.coach_note}</div>
        )}
      </div>
    </label>
  )
}

interface Props {
  dateKey: string
  title: string
  emoji: string
  category: string
  items: DayItem[]
  hasPlan: boolean
  loading: boolean
  onToggleItem: (id: string) => void
}

export function DayCard({ title, emoji, category, items, hasPlan, loading, onToggleItem }: Props) {
  const color = CAT_COLOR[category] ?? '#888'
  const done = items.filter(i => i.checked && !i.skipped).length
  const total = items.filter(i => !i.skipped).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  // Loading skeleton
  if (loading) {
    return (
      <div className="border border-steel bg-slate animate-pulse">
        <div className="px-4 py-4 space-y-3">
          <div className="h-5 bg-steel rounded w-2/3" />
          <div className="h-4 bg-steel rounded w-1/2" />
          <div className="h-4 bg-steel rounded w-3/4" />
        </div>
      </div>
    )
  }

  // Empty day — invite to use coach
  if (!hasPlan || items.length === 0) {
    return (
      <div className="border border-dashed border-zinc bg-slate">
        <div className="px-6 py-8 text-center space-y-3">
          <div className="text-4xl">📅</div>
          <div className="text-chalk text-sm font-mono font-bold">Journée vide</div>
          <div className="text-ash text-xs font-mono leading-relaxed max-w-xs mx-auto">
            Dis au coach ce que tu veux faire aujourd'hui, ou demande-lui de planifier toute ta semaine.
          </div>
          <div className="text-accent text-xs font-mono">→ Ouvre le Coach IA en bas à droite 🤖</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`border bg-slate transition-colors ${allDone ? 'border-accent border-opacity-60' : 'border-steel'}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-steel flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-chalk font-mono font-bold text-sm truncate">{title}</div>
          <div className="text-xs font-mono mt-0.5" style={{ color }}>
            {CATEGORY_META[category as keyof typeof CATEGORY_META]?.label ?? category}
          </div>
        </div>
        {/* Progress */}
        {total > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-xs font-mono" style={{ color: allDone ? '#C8F135' : '#888' }}>
              {done}/{total}
            </div>
            <div className="w-16 h-1.5 bg-steel">
              <div
                className="h-full transition-all"
                style={{ width: `${progress}%`, background: allDone ? '#C8F135' : color }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-steel divide-opacity-30">
        {items.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            color={color}
            onToggle={() => onToggleItem(item.id)}
          />
        ))}
      </div>

      {/* Completion message */}
      {allDone && (
        <div className="px-4 py-2.5 border-t border-accent border-opacity-30 bg-accent bg-opacity-5 text-center">
          <span className="text-accent text-xs font-mono font-bold">✓ Séance complète — bien joué !</span>
        </div>
      )}
    </div>
  )
}
