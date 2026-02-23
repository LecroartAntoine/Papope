'use client'

import { useState, useCallback } from 'react'
import { DayItem, DayItemType, ExerciseItem, ClimbItem, HikeItem, CardioItem, EventItem } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const TYPE_META: Record<DayItemType, { label: string; emoji: string; color: string }> = {
  exercise: { label: 'Exercice',   emoji: '💪', color: '#C8F135' },
  climb:    { label: 'Escalade',   emoji: '🧗', color: '#4EA8FF' },
  hike:     { label: 'Randonnée',  emoji: '🏔', color: '#F5A623' },
  cardio:   { label: 'Cardio',     emoji: '🏃', color: '#FF4E4E' },
  event:    { label: 'Événement',  emoji: '📌', color: '#A78BFA' },
  rest:     { label: 'Repos',      emoji: '😴', color: '#888888' },
}

function makeItem(type: DayItemType): DayItem {
  const base = { id: uid(), type, checked: false }
  switch (type) {
    case 'exercise': return { ...base, type: 'exercise', name: 'Nouvel exercice', sets: '3×8' } as ExerciseItem
    case 'climb':    return { ...base, type: 'climb', label: 'Séance escalade' } as ClimbItem
    case 'hike':     return { ...base, type: 'hike', label: 'Randonnée' } as HikeItem
    case 'cardio':   return { ...base, type: 'cardio', activity: 'Rameur' } as CardioItem
    case 'event':    return { ...base, type: 'event', label: 'Événement' } as EventItem
    default:         return { ...base, type: 'rest', label: 'Repos complet' }
  }
}

// ─── Item editors ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent transition-colors"
    />
  )
}

function ExerciseEditor({ item, onChange }: { item: ExerciseItem; onChange: (u: Partial<ExerciseItem>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Nom">
        <Input value={item.name} onChange={v => onChange({ name: v })} placeholder="Ex: Tractions" />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Séries×Reps">
          <Input value={item.sets ?? ''} onChange={v => onChange({ sets: v })} placeholder="3×8" />
        </Field>
        <Field label="Poids">
          <Input value={item.weight ?? ''} onChange={v => onChange({ weight: v })} placeholder="PC / 20kg" />
        </Field>
        <Field label="Reps">
          <Input value={item.reps ?? ''} onChange={v => onChange({ reps: v })} placeholder="8" />
        </Field>
      </div>
      <Field label="Notes">
        <Input value={item.notes ?? ''} onChange={v => onChange({ notes: v })} placeholder="Excentrique lent, RIR 2…" />
      </Field>
    </div>
  )
}

function ClimbEditor({ item, onChange }: { item: ClimbItem; onChange: (u: Partial<ClimbItem>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Label">
        <Input value={item.label ?? ''} onChange={v => onChange({ label: v })} placeholder="Séance escalade" />
      </Field>
      <Field label="Notes">
        <Input value={item.notes ?? ''} onChange={v => onChange({ notes: v })} placeholder="Focus technique, bras tendus…" />
      </Field>
    </div>
  )
}

function HikeEditor({ item, onChange }: { item: HikeItem; onChange: (u: Partial<HikeItem>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Nom / itinéraire">
        <Input value={item.label ?? ''} onChange={v => onChange({ label: v })} placeholder="Rando Crêt de la Perdrix" />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Distance (km)">
          <Input type="number" value={item.km?.toString() ?? ''} onChange={v => onChange({ km: parseFloat(v) || undefined })} placeholder="12" />
        </Field>
        <Field label="D+ (m)">
          <Input type="number" value={item.elevation_m?.toString() ?? ''} onChange={v => onChange({ elevation_m: parseInt(v) || undefined })} placeholder="850" />
        </Field>
        <Field label="Durée (min)">
          <Input type="number" value={item.duration_min?.toString() ?? ''} onChange={v => onChange({ duration_min: parseInt(v) || undefined })} placeholder="240" />
        </Field>
      </div>
      <Field label="Notes">
        <Input value={item.notes ?? ''} onChange={v => onChange({ notes: v })} placeholder="Sac 10kg, avec chien…" />
      </Field>
    </div>
  )
}

function CardioEditor({ item, onChange }: { item: CardioItem; onChange: (u: Partial<CardioItem>) => void }) {
  const activities = ['Rameur', 'Course', 'Vélo', 'Natation', 'Elliptique', 'Marche', 'Autre']
  return (
    <div className="space-y-3">
      <Field label="Activité">
        <select
          value={item.activity}
          onChange={e => onChange({ activity: e.target.value })}
          className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent"
        >
          {activities.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Durée (min)">
          <Input type="number" value={item.duration_min?.toString() ?? ''} onChange={v => onChange({ duration_min: parseInt(v) || undefined })} placeholder="30" />
        </Field>
        <Field label="Distance (km)">
          <Input type="number" value={item.distance_km?.toString() ?? ''} onChange={v => onChange({ distance_km: parseFloat(v) || undefined })} placeholder="5" />
        </Field>
      </div>
      <Field label="Notes">
        <Input value={item.notes ?? ''} onChange={v => onChange({ notes: v })} placeholder="Zone 2, 140bpm max…" />
      </Field>
    </div>
  )
}

function EventEditor({ item, onChange }: { item: EventItem; onChange: (u: Partial<EventItem>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Titre">
        <Input value={item.label} onChange={v => onChange({ label: v })} placeholder="Compétition, blessure, voyage…" />
      </Field>
      <Field label="Notes">
        <Input value={item.notes ?? ''} onChange={v => onChange({ notes: v })} />
      </Field>
    </div>
  )
}

// ─── Single item row ──────────────────────────────────────────────────────────

function ItemRow({
  item, index, total, onUpdate, onRemove, onMoveUp, onMoveDown,
}: {
  item: DayItem
  index: number
  total: number
  onUpdate: (u: Partial<DayItem>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[item.type]

  const label = (() => {
    switch (item.type) {
      case 'exercise': return (item as ExerciseItem).name
      case 'climb':    return (item as ClimbItem).label || 'Escalade'
      case 'hike':     return (item as HikeItem).label || 'Randonnée'
      case 'cardio':   return (item as CardioItem).activity
      case 'event':    return (item as EventItem).label
      default:         return 'Repos'
    }
  })()

  const sublabel = (() => {
    if (item.type === 'exercise') {
      const e = item as ExerciseItem
      return [e.sets, e.weight].filter(Boolean).join(' · ')
    }
    if (item.type === 'hike') {
      const h = item as HikeItem
      return [h.km && `${h.km}km`, h.elevation_m && `D+${h.elevation_m}m`].filter(Boolean).join(' · ')
    }
    if (item.type === 'cardio') {
      const c = item as CardioItem
      return c.duration_min ? `${c.duration_min} min` : ''
    }
    return ''
  })()

  return (
    <div className="border border-zinc bg-carbon rounded overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="text-zinc hover:text-ash disabled:opacity-20 text-xs leading-none">▲</button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-zinc hover:text-ash disabled:opacity-20 text-xs leading-none">▼</button>
        </div>

        {/* Type badge */}
        <span
          className="text-xs font-mono font-bold px-1.5 py-0.5 flex-shrink-0"
          style={{ background: `${meta.color}20`, color: meta.color }}
        >
          {meta.emoji}
        </span>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="text-chalk text-sm font-mono truncate">{label}</div>
          {sublabel && <div className="text-ash text-xs font-mono">{sublabel}</div>}
        </div>

        {/* Actions */}
        <button
          onClick={() => setExpanded(x => !x)}
          className="text-ash hover:text-accent text-xs font-mono px-2 py-1 border border-transparent hover:border-zinc transition-all flex-shrink-0"
        >
          {expanded ? 'Fermer' : 'Éditer'}
        </button>
        <button onClick={onRemove} className="text-zinc hover:text-crit transition-colors flex-shrink-0 text-sm">✕</button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-zinc pt-3 bg-slate">
          {item.type === 'exercise' && (
            <ExerciseEditor item={item as ExerciseItem} onChange={u => onUpdate(u)} />
          )}
          {item.type === 'climb' && (
            <ClimbEditor item={item as ClimbItem} onChange={u => onUpdate(u)} />
          )}
          {item.type === 'hike' && (
            <HikeEditor item={item as HikeItem} onChange={u => onUpdate(u)} />
          )}
          {item.type === 'cardio' && (
            <CardioEditor item={item as CardioItem} onChange={u => onUpdate(u)} />
          )}
          {item.type === 'event' && (
            <EventEditor item={item as EventItem} onChange={u => onUpdate(u)} />
          )}
          {item.type === 'rest' && (
            <div className="text-ash text-xs font-mono">Jour de repos — rien à configurer.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  dateKey: string
  title: string
  emoji: string
  items: DayItem[]
  isCustomized: boolean
  onAddItem: (item: DayItem) => void
  onUpdateItem: (id: string, updates: Partial<DayItem>) => void
  onRemoveItem: (id: string) => void
  onMoveItem: (from: number, to: number) => void
  onUpdateMeta: (updates: { title?: string; emoji?: string }) => void
  onResetToDefault: () => void
  onInitCustomPlan: () => void
}

const EMOJIS = ['💪', '🧗', '🏔', '🏃', '🧘', '🚴', '⚽', '🏊', '🎿', '⚪', '📌', '🟢', '🔵', '🔴', '🟡']

export function DayEditor({
  open, onClose, dateKey,
  title, emoji, items, isCustomized,
  onAddItem, onUpdateItem, onRemoveItem, onMoveItem,
  onUpdateMeta, onResetToDefault, onInitCustomPlan,
}: Props) {
  const [addingType, setAddingType] = useState<DayItemType | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(title)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleAdd = useCallback((type: DayItemType) => {
    if (!isCustomized) onInitCustomPlan()
    onAddItem(makeItem(type))
    setAddingType(null)
  }, [isCustomized, onInitCustomPlan, onAddItem])

  const handleTitleSave = () => {
    onUpdateMeta({ title: titleDraft })
    setEditingTitle(false)
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-carbon bg-opacity-60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel from right */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full sm:w-[480px] bg-carbon border-l border-steel flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-steel flex items-center justify-between flex-shrink-0 bg-slate">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Emoji picker */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(x => !x)}
                className="text-2xl hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-1 bg-slate border border-steel p-2 grid grid-cols-5 gap-1 z-10 shadow-xl">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => { onUpdateMeta({ emoji: e }); setShowEmojiPicker(false) }}
                      className="text-xl hover:bg-steel p-1 rounded transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                className="flex-1 bg-carbon border border-accent text-chalk text-sm font-mono px-2 py-1 focus:outline-none"
              />
            ) : (
              <button
                onClick={() => { setTitleDraft(title); setEditingTitle(true) }}
                className="text-chalk text-sm font-mono font-bold truncate hover:text-accent transition-colors text-left"
              >
                {title} ✎
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {isCustomized && (
              <button
                onClick={() => { if (confirm('Remettre le programme par défaut ?')) onResetToDefault() }}
                className="text-xs font-mono text-ash hover:text-crit border border-zinc px-2 py-1 transition-all"
              >
                Réinitialiser
              </button>
            )}
            <button onClick={onClose} className="text-ash hover:text-chalk text-lg w-8 h-8 flex items-center justify-center">✕</button>
          </div>
        </div>

        {/* Date + customized indicator */}
        <div className="px-4 py-2 border-b border-steel flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-ash font-mono">{dateKey}</span>
          <span className={`text-xs font-mono px-2 py-0.5 ${isCustomized ? 'text-accent border border-accent border-opacity-40' : 'text-zinc border border-zinc'}`}>
            {isCustomized ? '✎ Personnalisé' : '📋 Programme par défaut'}
          </span>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && (
            <div className="text-center py-12 text-ash text-sm font-mono">
              <div className="text-3xl mb-3">📋</div>
              Aucun exercice — ajoute-en un ci-dessous
            </div>
          )}

          {items.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              index={i}
              total={items.length}
              onUpdate={u => onUpdateItem(item.id, u)}
              onRemove={() => onRemoveItem(item.id)}
              onMoveUp={() => onMoveItem(i, i - 1)}
              onMoveDown={() => onMoveItem(i, i + 1)}
            />
          ))}
        </div>

        {/* Add item section */}
        <div className="p-4 border-t border-steel flex-shrink-0 bg-slate space-y-3">
          <div className="text-xs text-ash font-mono uppercase tracking-wider">Ajouter</div>

          {!addingType ? (
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TYPE_META) as [DayItemType, typeof TYPE_META[DayItemType]][]).map(([type, meta]) => (
                <button
                  key={type}
                  onClick={() => handleAdd(type)}
                  className="flex flex-col items-center gap-1 py-2 px-1 border border-zinc hover:border-accent hover:bg-accent hover:bg-opacity-5 transition-all"
                >
                  <span className="text-xl">{meta.emoji}</span>
                  <span className="text-xs font-mono text-ash">{meta.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setAddingType(null)} className="text-xs text-ash font-mono">← Annuler</button>
          )}
        </div>
      </div>
    </>
  )
}
