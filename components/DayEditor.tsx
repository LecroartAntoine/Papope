'use client'

import { useState, useEffect, useCallback } from 'react'
import { DayItem, ActivityCategory, ActivityDef, CATEGORY_META } from '@/types'

function uid() { return Math.random().toString(36).slice(2, 10) }

const EMOJIS = ['💪','🧗','🏔','🏃','🧘','🚴','⚽','🏊','🎿','🥊','🕹','🎮','⚪','📌','🟢','🔵','🔴','🟡','🏋','🦵','🚣','🏆','✈','😴','🧱']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  )
}
function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
}
function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
}

// ─── Item detail editor ───────────────────────────────────────────────────────
function ItemEditor({ item, activityDef, onUpdate }: {
  item: DayItem; activityDef?: ActivityDef; onUpdate: (u: Partial<DayItem>) => void
}) {
  const isStrength  = item.category === 'strength' || activityDef?.has_sets
  const isOutdoor   = activityDef?.is_outdoor
  const showDuration = item.category === 'movement' || item.category === 'recovery'

  return (
    <div className="space-y-3">
      <Field label="Label affiché">
        <TextInput value={item.label ?? ''} onChange={v => onUpdate({ label: v })} placeholder={item.activity} />
      </Field>
      {isStrength && (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Séries×Reps"><TextInput value={item.sets ?? ''} onChange={v => onUpdate({ sets: v })} placeholder="3×8" /></Field>
          <Field label="Poids"><TextInput value={item.weight ?? ''} onChange={v => onUpdate({ weight: v })} placeholder="20kg" /></Field>
          <Field label="Reps"><TextInput value={item.reps ?? ''} onChange={v => onUpdate({ reps: v })} placeholder="8" /></Field>
        </div>
      )}
      {showDuration && (
        <Field label="Durée (min)">
          <NumInput value={item.duration_min?.toString() ?? ''} onChange={v => onUpdate({ duration_min: parseInt(v) || undefined })} placeholder="45" />
        </Field>
      )}
      {isOutdoor && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Distance (km)"><NumInput value={item.km?.toString() ?? ''} onChange={v => onUpdate({ km: parseFloat(v) || undefined })} placeholder="12" /></Field>
          <Field label="D+ (m)"><NumInput value={item.elevation_m?.toString() ?? ''} onChange={v => onUpdate({ elevation_m: parseInt(v) || undefined })} placeholder="850" /></Field>
        </div>
      )}
      <Field label="Notes">
        <TextInput value={item.notes ?? ''} onChange={v => onUpdate({ notes: v })} placeholder="Observations, intensité…" />
      </Field>
    </div>
  )
}

// ─── Item row in editor ───────────────────────────────────────────────────────
function ItemRow({ item, activityDefs, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }: {
  item: DayItem; activityDefs: ActivityDef[]; index: number; total: number
  onUpdate: (u: Partial<DayItem>) => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const catMeta = CATEGORY_META[item.category]
  const actDef = activityDefs.find(a => a.name === item.activity)
  const sublabel = [item.sets, item.weight, item.duration_min && `${item.duration_min}min`, item.km && `${item.km}km`].filter(Boolean).join(' · ')

  return (
    <div className="border border-zinc bg-carbon overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="text-zinc hover:text-ash disabled:opacity-20 text-xs">▲</button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-zinc hover:text-ash disabled:opacity-20 text-xs">▼</button>
        </div>
        <span className="text-lg flex-shrink-0">{actDef?.emoji ?? catMeta.emoji}</span>
        <span className="text-xs font-mono px-1.5 py-0.5 flex-shrink-0" style={{ background: `${catMeta.color}20`, color: catMeta.color }}>
          {catMeta.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-chalk text-sm font-mono truncate">{item.label || item.activity}</div>
          {sublabel && <div className="text-ash text-xs font-mono">{sublabel}</div>}
        </div>
        <button onClick={() => setExpanded(x => !x)}
          className="text-ash hover:text-accent text-xs font-mono px-2 py-1 border border-transparent hover:border-zinc transition-all flex-shrink-0">
          {expanded ? 'Fermer' : 'Éditer'}
        </button>
        <button onClick={onRemove} className="text-zinc hover:text-crit transition-colors flex-shrink-0 px-1">✕</button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-zinc pt-3 bg-slate">
          <ItemEditor item={item} activityDef={actDef} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  )
}

// ─── Add item flow ────────────────────────────────────────────────────────────
function AddItemFlow({ activityDefs, onAdd, onCancel }: {
  activityDefs: ActivityDef[]; onAdd: (item: DayItem) => void; onCancel: () => void
}) {
  const [step, setStep] = useState<'category' | 'activity'>('category')
  const [selectedCat, setSelectedCat] = useState<ActivityCategory | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newEmoji, setNewEmoji] = useState('🏃')

  const catActivities = activityDefs.filter(a => a.category === selectedCat)
  const filtered = search ? catActivities.filter(a => a.name.toLowerCase().includes(search.toLowerCase())) : catActivities
  const exactMatch = catActivities.some(a => a.name.toLowerCase() === search.trim().toLowerCase())
  const canCreate = search.trim().length > 1 && !exactMatch

  const handlePickActivity = (act: ActivityDef) => {
    onAdd({ id: uid(), category: act.category as ActivityCategory, activity: act.name, duration_min: act.default_duration_min ?? undefined, checked: false } as DayItem)
  }

  const handleCreateNew = async () => {
    if (!search.trim() || !selectedCat) return
    setCreating(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: search.trim(), category: selectedCat, emoji: newEmoji, has_sets: selectedCat === 'strength', is_outdoor: false }),
      })
      const data = await res.json()
      if (!data.error) {
        onAdd({ id: uid(), category: selectedCat, activity: data.name ?? search.trim(), checked: false } as DayItem)
      }
    } catch { /* ignore */ }
    setCreating(false)
  }

  if (step === 'category') {
    return (
      <div className="space-y-3">
        <div className="text-xs text-ash font-mono uppercase tracking-wider">Choisir une catégorie</div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(CATEGORY_META) as [ActivityCategory, typeof CATEGORY_META[ActivityCategory]][]).map(([key, meta]) => (
            <button key={key} onClick={() => { setSelectedCat(key); setStep('activity') }}
              className="flex items-center gap-3 px-3 py-3 border border-zinc hover:border-accent transition-all text-left">
              <span className="text-xl">{meta.emoji}</span>
              <div>
                <div className="text-chalk text-sm font-mono">{meta.label}</div>
                <div className="text-ash text-xs font-mono">{meta.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="text-xs text-ash font-mono hover:text-chalk">Annuler</button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setStep('category')} className="text-ash hover:text-accent text-xs font-mono">←</button>
        <span className="text-xs text-ash font-mono uppercase tracking-wider">
          {CATEGORY_META[selectedCat!].emoji} {CATEGORY_META[selectedCat!].label}
        </span>
      </div>
      <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Chercher ou créer une activité…"
        className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.map(act => (
          <button key={act.id} onClick={() => handlePickActivity(act)}
            className="w-full flex items-center gap-3 px-3 py-2 border border-zinc hover:border-accent hover:bg-accent hover:bg-opacity-5 transition-all text-left">
            <span className="text-lg">{act.emoji}</span>
            <div className="flex-1">
              <div className="text-chalk text-sm font-mono">{act.name}</div>
              {act.default_duration_min && <div className="text-ash text-xs font-mono">{act.default_duration_min} min</div>}
            </div>
            <span className="text-accent text-xs font-mono">+</span>
          </button>
        ))}
        {filtered.length === 0 && !search && (
          <div className="text-ash text-xs font-mono text-center py-4">Tape pour chercher ou créer</div>
        )}
      </div>
      {canCreate && (
        <div className="border border-accent border-opacity-40 bg-accent bg-opacity-5 p-3 space-y-2">
          <div className="text-accent text-xs font-mono">Créer "{search.trim()}"</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ash font-mono">Emoji :</span>
            <div className="flex flex-wrap gap-1">
              {EMOJIS.slice(0, 12).map(e => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  className={`text-base p-1 transition-all ${newEmoji === e ? 'bg-accent bg-opacity-20 scale-125' : 'hover:bg-steel'}`}>{e}</button>
              ))}
            </div>
          </div>
          <button onClick={handleCreateNew} disabled={creating}
            className="w-full bg-accent text-carbon text-xs font-mono font-bold py-2 hover:bg-opacity-90 transition-all disabled:opacity-50">
            {creating ? 'Création…' : `+ Créer "${search.trim()}"`}
          </button>
        </div>
      )}
      <button onClick={onCancel} className="text-xs text-ash font-mono hover:text-chalk">Annuler</button>
    </div>
  )
}

// ─── Main DayEditor panel ─────────────────────────────────────────────────────
interface Props {
  open: boolean
  onClose: () => void
  dateKey: string
  title: string
  emoji: string
  items: DayItem[]
  hasPlan: boolean
  onAddItem: (item: DayItem) => void
  onUpdateItem: (id: string, updates: Partial<DayItem>) => void
  onRemoveItem: (id: string) => void
  onMoveItem: (from: number, to: number) => void
  onUpdateMeta: (updates: { title?: string; emoji?: string }) => void
  onClearDay: () => void
  onCreatePlan: () => void
}

export function DayEditor({
  open, onClose, dateKey, title, emoji, items, hasPlan,
  onAddItem, onUpdateItem, onRemoveItem, onMoveItem,
  onUpdateMeta, onClearDay, onCreatePlan,
}: Props) {
  const [activityDefs, setActivityDefs] = useState<ActivityDef[]>([])
  const [adding, setAdding] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(title)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/activities').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setActivityDefs(data)
      }).catch(() => {})
    }
  }, [open])

  useEffect(() => { setTitleDraft(title) }, [title])

  const handleTitleSave = () => { onUpdateMeta({ title: titleDraft }); setEditingTitle(false) }

  const handleAdd = useCallback((item: DayItem) => {
    if (!hasPlan) onCreatePlan()
    onAddItem(item)
    setAdding(false)
  }, [hasPlan, onCreatePlan, onAddItem])

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-carbon bg-opacity-60 backdrop-blur-sm" onClick={onClose} />}

      <div className={`fixed top-0 right-0 h-full z-50 w-full sm:w-[500px] bg-carbon border-l border-steel flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-steel flex items-center justify-between flex-shrink-0 bg-slate">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <button onClick={() => setShowEmojiPicker(x => !x)} className="text-2xl hover:scale-110 transition-transform">{emoji}</button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-1 bg-slate border border-steel p-2 grid grid-cols-5 gap-1 z-10 shadow-xl">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => { onUpdateMeta({ emoji: e }); setShowEmojiPicker(false) }}
                      className="text-xl hover:bg-steel p-1 transition-colors">{e}</button>
                  ))}
                </div>
              )}
            </div>
            {editingTitle ? (
              <input autoFocus value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave} onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                className="flex-1 bg-carbon border border-accent text-chalk text-sm font-mono px-2 py-1 focus:outline-none" />
            ) : (
              <button onClick={() => { setTitleDraft(title); setEditingTitle(true) }}
                className="text-chalk text-sm font-mono font-bold truncate hover:text-accent transition-colors text-left">
                {title || 'Nouvelle journée'} ✎
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {hasPlan && (
              <button onClick={() => { if (confirm('Vider cette journée ?')) onClearDay() }}
                className="text-xs font-mono text-ash hover:text-crit border border-zinc px-2 py-1 transition-all">
                Vider
              </button>
            )}
            <button onClick={onClose} className="text-ash hover:text-chalk text-lg w-8 h-8 flex items-center justify-center">✕</button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-steel flex-shrink-0">
          <span className="text-xs text-ash font-mono">{dateKey}</span>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && !adding && (
            <div className="text-center py-12 text-ash text-sm font-mono">
              <div className="text-3xl mb-3">📋</div>
              Journée vide — ajoute des activités
            </div>
          )}
          {items.map((item, i) => (
            <ItemRow key={item.id} item={item} activityDefs={activityDefs}
              index={i} total={items.length}
              onUpdate={u => onUpdateItem(item.id, u)}
              onRemove={() => onRemoveItem(item.id)}
              onMoveUp={() => onMoveItem(i, i - 1)}
              onMoveDown={() => onMoveItem(i, i + 1)} />
          ))}
          {adding && (
            <div className="border border-accent border-opacity-30 bg-slate p-4">
              <AddItemFlow activityDefs={activityDefs} onAdd={handleAdd} onCancel={() => setAdding(false)} />
            </div>
          )}
        </div>

        {/* Footer */}
        {!adding && (
          <div className="p-4 border-t border-steel flex-shrink-0 bg-slate">
            <button onClick={() => setAdding(true)}
              className="w-full py-2.5 border border-accent text-accent text-xs font-mono font-bold uppercase tracking-wider hover:bg-accent hover:text-carbon transition-all">
              + Ajouter une activité
            </button>
          </div>
        )}
      </div>
    </>
  )
}
