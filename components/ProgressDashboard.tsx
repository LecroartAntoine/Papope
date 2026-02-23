'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const fmt = (d: string) => {
  try { return format(parseISO(d), 'd MMM', { locale: fr }) } catch { return d }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate border border-steel px-3 py-2 text-xs font-mono">
      <div className="text-ash mb-1">{fmt(label)}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

const GRADE_ORDER = ['4','4+','5','5+','6a','6a+','6b','6b+','6c','6c+','7a','7a+','7b','7b+','7c','7c+','8a','8a+','8b']
const gradeToNum = (g: string) => GRADE_ORDER.indexOf(g) + 1

function EmptyState({ label }: { label: string }) {
  return <div className="h-40 flex items-center justify-center text-zinc text-xs font-mono">{label}</div>
}

function PainChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyState label="Aucune donnée de douleur" />
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis domain={[0, 10]} tick={{ fill: '#888', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={4} stroke="#F5A623" strokeDasharray="4 2" />
        <Bar dataKey="pain_level" name="Douleur" radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pain_level >= 7 ? '#FF4E4E' : d.pain_level >= 4 ? '#F5A623' : '#C8F135'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function WeightChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyState label="Aucune donnée de poids" />
  const vals = data.map(d => d.weight_kg).filter(Boolean)
  const min = Math.floor(Math.min(...vals)) - 1
  const max = Math.ceil(Math.max(...vals)) + 1
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis domain={[min, max]} tick={{ fill: '#888', fontSize: 10 }} unit="kg" />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="weight_kg" name="Poids" stroke="#4EA8FF" strokeWidth={2} dot={{ r: 3, fill: '#4EA8FF' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function WellbeingChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyState label="Aucune donnée de bien-être" />
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis domain={[0, 10]} tick={{ fill: '#888', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="humeur" name="Humeur" stroke="#C8F135" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="fatigue" name="Fatigue" stroke="#FF4E4E" strokeWidth={1.5} dot={false} strokeDasharray="3 2" connectNulls />
        <Line type="monotone" dataKey="stress" name="Stress" stroke="#F5A623" strokeWidth={1.5} dot={false} strokeDasharray="5 3" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

function NutritionChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyState label="Aucune donnée nutrition" />
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis tick={{ fill: '#888', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={150} stroke="#C8F135" strokeDasharray="4 2" />
        <Bar dataKey="proteines_g" name="Protéines (g)" fill="#C8F135" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ClimbChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyState label="Aucune donnée escalade" />
  const byDate: Record<string, { date: string; best: number; attempts: number }> = {}
  data.forEach(c => {
    const n = gradeToNum(c.grade)
    if (!byDate[c.date]) byDate[c.date] = { date: c.date, best: 0, attempts: 0 }
    byDate[c.date].attempts++
    if (c.completed && n > byDate[c.date].best) byDate[c.date].best = n
  })
  const chartData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis domain={[0, 18]} tickFormatter={v => GRADE_ORDER[v - 1] ?? ''} tick={{ fill: '#888', fontSize: 10 }} />
        <Tooltip content={({ active, payload, label }: any) => {
          if (!active || !payload?.length) return null
          return (
            <div className="bg-slate border border-steel px-3 py-2 text-xs font-mono">
              <div className="text-ash mb-1">{fmt(label)}</div>
              <div style={{ color: '#4EA8FF' }}>Meilleure cotation : {GRADE_ORDER[payload[0]?.value - 1] ?? '—'}</div>
              <div className="text-ash">Voies : {payload[1]?.value ?? 0}</div>
            </div>
          )
        }} />
        <Line type="monotone" dataKey="best" name="Meilleure cotation" stroke="#4EA8FF" strokeWidth={2} dot={{ r: 4, fill: '#4EA8FF' }} connectNulls />
        <Line type="monotone" dataKey="attempts" name="Voies" stroke="#3A3A3A" strokeWidth={1} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

type Tab = 'douleur' | 'poids' | 'bien-etre' | 'nutrition' | 'escalade'

export function ProgressDashboard() {
  const [tab, setTab] = useState<Tab>('douleur')
  const [painData, setPainData] = useState<any[]>([])
  const [weightData, setWeightData] = useState<any[]>([])
  const [wellbeingData, setWellbeingData] = useState<any[]>([])
  const [nutritionData, setNutritionData] = useState<any[]>([])
  const [climbData, setClimbData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/session/all-pain?days=60').then(r => r.json()).catch(() => []),
      fetch('/api/metrics?days=90').then(r => r.json()).catch(() => []),
      fetch('/api/wellbeing?days=60').then(r => r.json()).catch(() => []),
      fetch('/api/nutrition?days=60').then(r => r.json()).catch(() => []),
      fetch('/api/climbs?days=90').then(r => r.json()).catch(() => []),
    ]).then(([pain, weight, wb, nutr, climbs]) => {
      setPainData(Array.isArray(pain) ? pain : [])
      setWeightData(Array.isArray(weight) ? weight : [])
      setWellbeingData(Array.isArray(wb) ? wb : [])
      setNutritionData(Array.isArray(nutr) ? nutr : [])
      setClimbData(Array.isArray(climbs) ? climbs : [])
    }).finally(() => setLoading(false))
  }, [])

  const avgPain = painData.length
    ? (painData.reduce((s, d) => s + (d.pain_level ?? 0), 0) / painData.length).toFixed(1) : '—'
  const latestWeight = weightData.length ? weightData[weightData.length - 1]?.weight_kg : null
  const totalSent = climbData.filter((c: any) => c.completed).length
  const bestGrade = climbData.filter((c: any) => c.completed)
    .reduce((best: string, c: any) => gradeToNum(c.grade) > gradeToNum(best) ? c.grade : best, '4')
  const avgMood = wellbeingData.filter(d => d.humeur).length
    ? (wellbeingData.reduce((s, d) => s + (d.humeur ?? 0), 0) / wellbeingData.filter(d => d.humeur).length).toFixed(1) : '—'

  const tabs: { key: Tab; label: string }[] = [
    { key: 'douleur', label: 'Douleur' },
    { key: 'poids', label: 'Poids' },
    { key: 'bien-etre', label: 'Bien-être' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'escalade', label: 'Escalade' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Douleur moy.', value: `${avgPain}/10`, color: '#F5A623' },
          { label: 'Poids actuel', value: latestWeight ? `${latestWeight}kg` : '—', color: '#4EA8FF' },
          { label: 'Voies enchaînées', value: totalSent.toString(), color: '#C8F135' },
          { label: 'Humeur moy.', value: `${avgMood}/10`, color: '#C8F135' },
        ].map((s, i) => (
          <div key={i} className="bg-slate border border-steel p-4">
            <div className="text-xs text-ash font-mono uppercase tracking-wider mb-1">{s.label}</div>
            <div className="font-display text-3xl font-black tracking-tight" style={{ color: s.color }}>
              {loading ? '…' : s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate border border-steel">
        <div className="flex border-b border-steel overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex-shrink-0 ${
                tab === t.key ? 'text-accent border-b-2 border-accent' : 'text-ash hover:text-chalk'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'douleur' && (
            <>
              <div className="flex items-baseline justify-between mb-4">
                <div className="text-sm font-mono text-chalk">Douleur bras — 60 derniers jours</div>
                <div className="text-xs text-ash font-mono">Ligne orange = seuil d'arrêt (4/10)</div>
              </div>
              {loading ? <div className="h-40 animate-pulse bg-steel rounded" /> : <PainChart data={painData} />}
            </>
          )}
          {tab === 'poids' && (
            <>
              <div className="text-sm font-mono text-chalk mb-4">Poids corporel — 90 derniers jours</div>
              {loading ? <div className="h-40 animate-pulse bg-steel rounded" /> : <WeightChart data={weightData} />}
            </>
          )}
          {tab === 'bien-etre' && (
            <>
              <div className="flex items-baseline justify-between mb-4">
                <div className="text-sm font-mono text-chalk">Humeur / Fatigue / Stress</div>
                <div className="text-xs text-ash font-mono hidden sm:block">Vert=humeur · Rouge=fatigue · Orange=stress</div>
              </div>
              {loading ? <div className="h-40 animate-pulse bg-steel rounded" /> : <WellbeingChart data={wellbeingData} />}
            </>
          )}
          {tab === 'nutrition' && (
            <>
              <div className="flex items-baseline justify-between mb-4">
                <div className="text-sm font-mono text-chalk">Protéines — 60 derniers jours</div>
                <div className="text-xs text-ash font-mono">Ligne verte = objectif 150g</div>
              </div>
              {loading ? <div className="h-40 animate-pulse bg-steel rounded" /> : <NutritionChart data={nutritionData} />}
            </>
          )}
          {tab === 'escalade' && (
            <>
              <div className="text-sm font-mono text-chalk mb-4">Cotations enchaînées — 90 derniers jours</div>
              {loading ? <div className="h-40 animate-pulse bg-steel rounded" /> : <ClimbChart data={climbData} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
