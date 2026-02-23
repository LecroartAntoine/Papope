'use client'

import { useState, useEffect } from 'react'

const GRADES = [
  '4', '4+', '5', '5+',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b',
]

const STYLES = ['À vue', 'Flash', 'Redpoint', 'Moulinette', 'Tentative']

interface ClimbEntry {
  id: number
  grade: string
  style: string
  completed: boolean
  notes: string
}

export function ClimbLogger({ dateKey }: { dateKey: string }) {
  const [climbs, setClimbs] = useState<ClimbEntry[]>([])
  const [grade, setGrade] = useState('6a')
  const [style, setStyle] = useState('Redpoint')
  const [completed, setCompleted] = useState(true)
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch(`/api/climbs?date=${dateKey}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setClimbs(data) })
      .catch(() => {})
  }, [dateKey])

  const addClimb = async () => {
    setAdding(true)
    try {
      const res = await fetch('/api/climbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, grade, style, completed, notes: notes || null }),
      })
      const data = await res.json()
      setClimbs(prev => [...prev, data])
      setNotes('')
    } catch {}
    setAdding(false)
  }

  const removeClimb = async (id: number) => {
    await fetch(`/api/climbs?id=${id}`, { method: 'DELETE' }).catch(() => {})
    setClimbs(prev => prev.filter(c => c.id !== id))
  }

  const gradeColor = (g: string) => {
    const idx = GRADES.indexOf(g)
    if (idx < 4) return '#4EA8FF'
    if (idx < 8) return '#C8F135'
    if (idx < 12) return '#F5A623'
    return '#FF4E4E'
  }

  return (
    <div className="border-t border-steel pt-4">
      <div className="text-xs text-ash tracking-[0.2em] uppercase mb-3 font-mono">
        Voies réalisées ({climbs.length})
      </div>

      {climbs.length > 0 && (
        <div className="space-y-2 mb-4">
          {climbs.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-carbon border border-zinc px-3 py-2 rounded">
              <span
                className="font-mono font-bold text-sm px-2 py-0.5 rounded"
                style={{ background: `${gradeColor(c.grade)}22`, color: gradeColor(c.grade) }}
              >
                {c.grade}
              </span>
              <span className="text-ghost text-xs font-mono flex-1">{c.style}</span>
              <span className={`text-xs font-mono ${c.completed ? 'text-accent' : 'text-crit'}`}>
                {c.completed ? '✓ enchaîné' : '✗ projet'}
              </span>
              {c.notes && <span className="text-zinc text-xs truncate max-w-[80px]">{c.notes}</span>}
              <button onClick={() => removeClimb(c.id)} className="text-zinc hover:text-crit text-xs ml-1 transition-colors">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-carbon border border-zinc p-3 rounded space-y-3">
        <div className="text-zinc text-xs font-mono">Ajouter une voie</div>
        <div className="flex gap-2 flex-wrap">
          <div>
            <label className="text-zinc text-xs block mb-1">Cotation</label>
            <select value={grade} onChange={e => setGrade(e.target.value)}
              className="bg-steel border border-zinc text-chalk text-sm font-mono px-2 py-1.5 focus:outline-none focus:border-ghost">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-zinc text-xs block mb-1">Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)}
              className="bg-steel border border-zinc text-chalk text-sm font-mono px-2 py-1.5 focus:outline-none focus:border-ghost">
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="check-box" checked={completed} onChange={e => setCompleted(e.target.checked)} />
              <span className="text-xs text-ghost font-mono">Enchaîné</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)}
            className="flex-1 bg-steel border border-zinc text-chalk text-sm font-mono px-2 py-1.5 focus:outline-none focus:border-ghost placeholder-zinc" />
          <button onClick={addClimb} disabled={adding}
            className="bg-accent text-carbon text-xs font-mono font-bold px-4 py-1.5 hover:bg-opacity-90 transition-all disabled:opacity-50">
            {adding ? '…' : '+ AJOUTER'}
          </button>
        </div>
      </div>
    </div>
  )
}
