'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useDayState } from '@/lib/useCheckState'

interface Supplement {
  id: number
  name: string
  unit: string
  target: number | null
  emoji: string
  color: string
  hint: string | null
  sort_order: number
  is_enabled: boolean
  climb_only: boolean
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span style={{ color }}>{value}</span>
        <span className="text-ash">/ {target}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-zinc text-xs font-mono mt-0.5 text-right">{pct}%</div>
    </div>
  )
}

const COLORS = ['#C8F135','#4EA8FF','#F5A623','#A78BFA','#64D8FF','#FF4E4E','#FF9F43','#00D2D3']
const EMOJIS_QUICK = ['💊','🥩','💧','⚡','🦴','🧪','🌿','🫀','🏃','🧬','🫁','🍋','🫐','🌊','🔋','🫙']

function SupplementEditor({ supp, onSave, onDelete, onClose }: {
  supp: Supplement
  onSave: (u: Partial<Supplement>) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
}) {
  const [d, setD] = useState({ ...supp })
  const [saving, setSaving] = useState(false)

  return (
    <div className="border border-accent border-opacity-40 bg-carbon p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-accent text-xs font-mono uppercase tracking-wider">Modifier</span>
        <button onClick={onClose} className="text-zinc hover:text-chalk">✕</button>
      </div>

      <div>
        <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Emoji</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS_QUICK.map(e => (
            <button key={e} onClick={() => setD(x => ({ ...x, emoji: e }))}
              className={`text-lg p-1 transition-all ${d.emoji === e ? 'scale-125' : 'opacity-50 hover:opacity-100'}`}>{e}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Nom</label>
          <input value={d.name} onChange={e => setD(x => ({ ...x, name: e.target.value }))}
            className="w-full bg-slate border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Unité</label>
          <input value={d.unit} onChange={e => setD(x => ({ ...x, unit: e.target.value }))} placeholder="g, ml, cp…"
            className="w-full bg-slate border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Objectif</label>
          <input type="number" value={d.target ?? ''} onChange={e => setD(x => ({ ...x, target: parseFloat(e.target.value) || null }))}
            placeholder="Ex: 150"
            className="w-full bg-slate border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Rappel</label>
          <input value={d.hint ?? ''} onChange={e => setD(x => ({ ...x, hint: e.target.value || null }))}
            placeholder="Ex: avant séance"
            className="w-full bg-slate border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Couleur</label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setD(x => ({ ...x, color: c }))}
              className={`w-7 h-7 rounded-full border-2 transition-all ${d.color === c ? 'border-chalk scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={d.climb_only} onChange={e => setD(x => ({ ...x, climb_only: e.target.checked }))} className="check-box" />
        <span className="text-xs font-mono text-ash">Visible seulement les jours d'escalade</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button onClick={async () => { setSaving(true); await onSave(d); setSaving(false); onClose() }} disabled={saving}
          className="flex-1 bg-accent text-carbon text-xs font-mono font-bold py-2 hover:bg-opacity-90 disabled:opacity-50">
          {saving ? 'Sauvegarde…' : '✓ Sauvegarder'}
        </button>
        <button onClick={async () => { await onDelete(); onClose() }}
          className="px-3 py-2 text-xs font-mono text-crit border border-crit border-opacity-40 hover:bg-crit hover:bg-opacity-10">
          Supprimer
        </button>
      </div>
    </div>
  )
}

function AddSupplementForm({ onAdd, onClose }: { onAdd: () => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('g')
  const [target, setTarget] = useState('')
  const [emoji, setEmoji] = useState('💊')
  const [hint, setHint] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <div className="border border-dashed border-accent border-opacity-40 bg-carbon p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-accent text-xs font-mono uppercase tracking-wider">Nouveau supplément</span>
        <button onClick={onClose} className="text-zinc hover:text-chalk">✕</button>
      </div>

      <div>
        <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Emoji</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS_QUICK.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`text-lg p-1 transition-all ${emoji === e ? 'scale-125' : 'opacity-50 hover:opacity-100'}`}>{e}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Nom</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Magnésium"
            onKeyDown={e => e.key === 'Enter' && name.trim() && !saving && (async () => { setSaving(true); await fetch('/api/supplements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',name:name.trim(),unit,target:target?parseFloat(target):null,emoji,hint:hint||null})}); onAdd(); onClose() })()}
            className="w-full bg-slate border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Unité</label>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="g / ml / cp"
            className="w-full bg-slate border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Objectif</label>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="Ex: 400"
            className="w-full bg-slate border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1">Rappel</label>
          <input value={hint} onChange={e => setHint(e.target.value)} placeholder="Ex: Avec repas"
            className="w-full bg-slate border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
      </div>

      <button
        onClick={async () => {
          if (!name.trim()) return
          setSaving(true)
          await fetch('/api/supplements', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', name: name.trim(), unit, target: target ? parseFloat(target) : null, emoji, hint: hint || null }),
          })
          onAdd()
          onClose()
        }}
        disabled={!name.trim() || saving}
        className="w-full bg-accent text-carbon text-xs font-mono font-bold py-2 hover:bg-opacity-90 disabled:opacity-50">
        {saving ? 'Ajout…' : '+ Ajouter'}
      </button>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface Props { dateKey: string; isClimbDay: boolean }

export function NutritionPanel({ dateKey, isClimbDay }: Props) {
  const { state, setWeight } = useDayState(dateKey)
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [logs, setLogs] = useState<Record<number, string>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [manage, setManage] = useState(false)
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  const loadSupplements = useCallback(async () => {
    const res = await fetch('/api/supplements')
    const data = await res.json()
    if (Array.isArray(data)) setSupplements(data)
  }, [])

  const loadLogs = useCallback(async () => {
    initialized.current = false
    const res = await fetch(`/api/supplement-logs?date=${dateKey}`)
    const data = await res.json()
    if (data && typeof data === 'object' && !data.error) {
      const strs: Record<number, string> = {}
      Object.entries(data).forEach(([id, val]) => { strs[Number(id)] = val != null ? String(val) : '' })
      setLogs(strs)
    } else {
      setLogs({})
    }
    setTimeout(() => { initialized.current = true }, 150)
  }, [dateKey])

  useEffect(() => { loadSupplements(); loadLogs() }, [loadSupplements, loadLogs])

  const debouncedLogs = useDebounce(logs, 900)
  useEffect(() => {
    if (!initialized.current) return
    const enabled = supplements.filter(s => s.is_enabled)
    if (!enabled.length) return
    setSaving(true)
    fetch('/api/supplement-logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateKey, entries: enabled.map(s => ({ supplement_id: s.id, value: debouncedLogs[s.id] || null })) }),
    }).catch(() => {}).finally(() => setSaving(false))
  }, [debouncedLogs, dateKey, supplements])

  const handleSaveSupp = async (id: number, updates: Partial<Supplement>) => {
    await fetch('/api/supplements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', id, ...updates }) })
    await loadSupplements()
  }

  const handleDeleteSupp = async (id: number) => {
    await fetch('/api/supplements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) })
    await loadSupplements()
  }

  const visible = supplements.filter(s => s.is_enabled && (!s.climb_only || isClimbDay))
  const climbReminders = supplements.filter(s => s.is_enabled && s.climb_only && s.hint && isClimbDay)

  return (
    <div className="space-y-4">
      <div className="border border-steel bg-slate">
        {/* Header */}
        <div className="px-5 py-3 border-b border-steel flex items-center justify-between">
          <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono">Nutrition du jour</div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-zinc text-xs font-mono animate-pulse">sauvegarde…</span>}
            <button onClick={() => { setManage(m => !m); setAddingNew(false); setEditingId(null) }}
              className={`text-xs font-mono px-2 py-1 border transition-all ${manage ? 'border-accent text-accent bg-accent bg-opacity-5' : 'border-zinc text-ash hover:border-accent hover:text-accent'}`}>
              {manage ? '✓ Terminé' : '⚙ Gérer'}
            </button>
          </div>
        </div>

        {/* Climb-day reminders */}
        {climbReminders.map(s => (
          <div key={s.id} className="mx-4 mt-4 px-3 py-2 text-xs font-mono flex items-center gap-2 border border-opacity-30 bg-opacity-5"
            style={{ borderColor: s.color, background: `${s.color}08`, color: s.color }}>
            <span>{s.emoji}</span>
            <span>Jour d'escalade — <strong>{s.name}</strong> : {s.hint}</span>
          </div>
        ))}

        {/* Log inputs */}
        <div className="p-4 space-y-5">
          {visible.length === 0 && !manage && (
            <div className="text-center py-6 text-ash text-sm font-mono">
              <div className="text-2xl mb-2">🧪</div>
              Clique sur ⚙ Gérer pour configurer tes suppléments
            </div>
          )}

          {visible.map(s => (
            <div key={s.id}>
              {editingId === s.id ? (
                <SupplementEditor supp={s}
                  onSave={u => handleSaveSupp(s.id, u)}
                  onDelete={() => handleDeleteSupp(s.id)}
                  onClose={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="flex items-center gap-1 mb-1">
                    <span>{s.emoji}</span>
                    <label className="text-xs text-ash tracking-[0.15em] uppercase font-mono flex-1">
                      {s.name}
                      {s.target && <span className="text-zinc normal-case font-normal ml-1">— objectif {s.target} {s.unit}</span>}
                      {s.hint && !s.climb_only && <span className="text-info normal-case font-normal ml-1">· {s.hint}</span>}
                    </label>
                    {manage && (
                      <button onClick={() => setEditingId(s.id)}
                        className="text-zinc hover:text-accent text-xs border border-transparent hover:border-zinc px-1.5 py-0.5 transition-all ml-auto">
                        ✎ modifier
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="number" min="0"
                      step={s.unit === 'ml' ? '50' : s.unit === 'cp' ? '1' : '0.5'}
                      placeholder="0" value={logs[s.id] ?? ''}
                      onChange={e => setLogs(prev => ({ ...prev, [s.id]: e.target.value }))}
                      className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-ghost transition-colors" />
                    <span className="text-ash text-sm font-mono flex-shrink-0 w-8">{s.unit}</span>
                  </div>
                  {s.target && <ProgressBar value={parseFloat(logs[s.id] || '0')} target={s.target} color={s.color} />}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Manage panel */}
        {manage && (
          <div className="border-t border-steel px-4 pb-4 pt-4 space-y-2">
            <div className="text-xs text-ash font-mono uppercase tracking-wider mb-3">Tous les suppléments</div>
            {supplements.map(s => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-steel border-opacity-20 last:border-0">
                <span className="text-lg">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-chalk text-sm font-mono">{s.name}</div>
                  <div className="text-ash text-xs font-mono">
                    {s.target ? `${s.target} ${s.unit}` : s.unit}
                    {s.climb_only ? ' · escalade seulement' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={async () => { await handleSaveSupp(s.id, { is_enabled: !s.is_enabled }) }}
                    className={`text-xs font-mono px-2 py-0.5 border transition-all ${s.is_enabled ? 'border-accent text-accent' : 'border-zinc text-zinc'}`}>
                    {s.is_enabled ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => setEditingId(s.id === editingId ? null : s.id)}
                    className="text-xs font-mono text-ash hover:text-accent border border-zinc px-2 py-0.5 transition-all">
                    ✎
                  </button>
                </div>
              </div>
            ))}

            {addingNew ? (
              <AddSupplementForm onAdd={loadSupplements} onClose={() => setAddingNew(false)} />
            ) : (
              <button onClick={() => setAddingNew(true)}
                className="w-full py-2 mt-2 border border-dashed border-zinc text-ash text-xs font-mono hover:border-accent hover:text-accent transition-all">
                + Ajouter un supplément
              </button>
            )}
          </div>
        )}
      </div>

      {/* Weight */}
      <div className="border border-steel bg-slate p-4">
        <div className="text-xs text-ash tracking-[0.2em] uppercase font-mono mb-3">Poids corporel</div>
        <div className="flex items-center gap-2">
          <input type="number" step="0.1" min="40" max="250"
            value={state.weight ?? ''} placeholder="84.0"
            onChange={e => setWeight(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-ghost transition-colors" />
          <span className="text-ash text-sm font-mono flex-shrink-0">kg</span>
        </div>
      </div>

    </div>
  )
}
