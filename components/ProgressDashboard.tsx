'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const fmtDate = (d: string) => {
  try { return format(parseISO(d), 'd MMM', { locale: fr }) } catch { return d }
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate border border-steel px-3 py-2 text-xs font-mono shadow-lg">
      <div className="text-ash mb-1">{fmtDate(label)}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center text-zinc text-xs font-mono gap-2">
      <div className="text-2xl opacity-30">📊</div>
      <div>{label}</div>
    </div>
  )
}

function Skeleton() {
  return <div className="h-44 animate-pulse bg-steel rounded" />
}

// ─── Individual charts ────────────────────────────────────────────────────────

function WellbeingChart({ data }: { data: any[] }) {
  if (!data.length) return <Empty label="Aucune donnée bien-être" />
  return (
    <ResponsiveContainer width="100%" height={176}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis domain={[0, 10]} tick={{ fill: '#888', fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="humeur"  name="Humeur"  stroke="#C8F135" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="fatigue" name="Fatigue" stroke="#FF4E4E" strokeWidth={1.5} dot={false} strokeDasharray="3 2" connectNulls />
        <Line type="monotone" dataKey="stress"  name="Stress"  stroke="#F5A623" strokeWidth={1.5} dot={false} strokeDasharray="5 3" connectNulls />
        <Line type="monotone" dataKey="douleur_generale" name="Douleur" stroke="#A78BFA" strokeWidth={1.5} dot={false} strokeDasharray="2 2" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SleepChart({ data }: { data: any[] }) {
  const filtered = data.filter(d => d.sommeil_h != null)
  if (!filtered.length) return <Empty label="Aucune donnée de sommeil" />
  return (
    <ResponsiveContainer width="100%" height={176}>
      <BarChart data={filtered} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis domain={[0, 12]} tick={{ fill: '#888', fontSize: 10 }} unit="h" />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={8} stroke="#4EA8FF" strokeDasharray="4 2" label={{ value: '8h', fill: '#4EA8FF', fontSize: 9 }} />
        <Bar dataKey="sommeil_h" name="Sommeil (h)" radius={[2, 2, 0, 0]}>
          {filtered.map((d, i) => (
            <Cell key={i} fill={d.sommeil_h >= 7.5 ? '#C8F135' : d.sommeil_h >= 6 ? '#F5A623' : '#FF4E4E'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function WeightChart({ data }: { data: any[] }) {
  if (!data.length) return <Empty label="Aucune donnée de poids" />
  const vals = data.map(d => parseFloat(d.weight_kg)).filter(Boolean)
  const min = Math.floor(Math.min(...vals)) - 1
  const max = Math.ceil(Math.max(...vals)) + 1
  return (
    <ResponsiveContainer width="100%" height={176}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis domain={[min, max]} tick={{ fill: '#888', fontSize: 10 }} unit="kg" />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="weight_kg" name="Poids (kg)" stroke="#4EA8FF" strokeWidth={2} dot={{ r: 3, fill: '#4EA8FF' }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SupplementChart({ data }: { data: any[] }) {
  if (!data.length) return <Empty label="Aucune donnée nutrition" />

  // Group by supplement name — build a dataset per date with all supps
  const dates = [...new Set(data.map(r => r.date))].sort()
  const suppNames = [...new Set(data.map(r => r.name))]

  const chartData = dates.map(date => {
    const row: any = { date }
    data.filter(r => r.date === date).forEach(r => { row[r.name] = parseFloat(r.value) })
    return row
  })

  const SUPP_COLORS = ['#C8F135', '#4EA8FF', '#F5A623', '#A78BFA', '#64D8FF', '#FF9F43']

  return (
    <ResponsiveContainer width="100%" height={176}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis tick={{ fill: '#888', fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        {suppNames.map((name, i) => (
          <Line key={name} type="monotone" dataKey={name} name={name}
            stroke={SUPP_COLORS[i % SUPP_COLORS.length]} strokeWidth={2}
            dot={{ r: 2 }} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function ActivityChart({ data }: { data: any[] }) {
  if (!data.length) return <Empty label="Aucune activité loggée" />

  // Count completed items per day
  const byDate: Record<string, number> = {}
  data.forEach(day => {
    if (!day.items?.length) return
    const completed = day.items.filter((i: any) => i.checked).length
    if (completed > 0) byDate[day.date] = completed
  })

  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  if (!chartData.length) return <Empty label="Aucune tâche complétée" />

  return (
    <ResponsiveContainer width="100%" height={176}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis tick={{ fill: '#888', fontSize: 10 }} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" name="Tâches complétées" fill="#C8F135" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'bienetre' | 'sommeil' | 'poids' | 'nutrition' | 'activite'

export function ProgressDashboard() {
  const [tab, setTab] = useState<Tab>('bienetre')
  const [loading, setLoading] = useState(true)
  const [wellbeing, setWellbeing] = useState<any[]>([])
  const [weight, setWeight] = useState<any[]>([])
  const [supplements, setSupplements] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/wellbeing?days=60').then(r => r.json()).catch(() => []),
      fetch('/api/metrics?days=90').then(r => r.json()).catch(() => []),
      fetch('/api/supplement-logs?days=30').then(r => r.json()).catch(() => []),
      fetch('/api/day-plan/week?from=' +
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] +
        '&to=' + new Date().toISOString().split('T')[0]
      ).then(r => r.json()).catch(() => ({})),
    ]).then(([wb, wt, supp, plans]) => {
      setWellbeing(Array.isArray(wb) ? wb : [])
      setWeight(Array.isArray(wt) ? wt : [])
      setSupplements(Array.isArray(supp) ? supp : [])
      // Convert plans map to array
      const plansArr = plans && !plans.error
        ? Object.entries(plans).map(([date, p]: [string, any]) => ({ date: date.split('T')[0], ...p }))
        : []
      setActivities(plansArr)
    }).finally(() => setLoading(false))
  }, [])

  // Stats
  const latestWeight = weight.length ? weight[weight.length - 1]?.weight_kg : null
  const avgMood = wellbeing.filter(d => d.humeur).length
    ? (wellbeing.reduce((s, d) => s + (d.humeur ?? 0), 0) / wellbeing.filter(d => d.humeur).length).toFixed(1)
    : null
  const avgStress = wellbeing.filter(d => d.stress).length
    ? (wellbeing.reduce((s, d) => s + (d.stress ?? 0), 0) / wellbeing.filter(d => d.stress).length).toFixed(1)
    : null
  const avgSleep = wellbeing.filter(d => d.sommeil_h).length
    ? (wellbeing.reduce((s, d) => s + (parseFloat(d.sommeil_h ?? '0')), 0) / wellbeing.filter(d => d.sommeil_h).length).toFixed(1)
    : null
  const totalCompleted = activities.reduce((s, d) =>
    s + (d.items?.filter((i: any) => i.checked).length ?? 0), 0)

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'bienetre',  label: 'Bien-être', emoji: '🌡' },
    { key: 'sommeil',   label: 'Sommeil',   emoji: '😴' },
    { key: 'poids',     label: 'Poids',     emoji: '⚖' },
    { key: 'nutrition', label: 'Nutrition', emoji: '🥗' }
  ]

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Poids',       value: latestWeight ? `${latestWeight} kg` : '—', color: '#4EA8FF'  },
          { label: 'Humeur moy.', value: avgMood ? `${avgMood}/10` : '—',           color: '#C8F135'  },
          { label: 'Stress moy.', value: avgStress ? `${avgStress}/10` : '—',           color: '#F5A623'  },
          { label: 'Sommeil moy.',value: avgSleep ? `${avgSleep}h` : '—',           color: '#A78BFA'  },
        ].map((s, i) => (
          <div key={i} className="bg-slate border border-steel p-4">
            <div className="text-xs text-ash font-mono uppercase tracking-wider mb-1">{s.label}</div>
            <div className="font-display text-3xl font-black tracking-tight" style={{ color: s.color }}>
              {loading ? <span className="animate-pulse text-steel">…</span> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart panel */}
      <div className="bg-slate border border-steel">
        <div className="flex border-b border-steel overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-all flex-shrink-0 flex items-center gap-1.5 ${
                tab === t.key ? 'text-accent border-b-2 border-accent' : 'text-ash hover:text-chalk'
              }`}>
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'bienetre' && (
            <>
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm font-mono text-chalk">Humeur · Fatigue · Stress · Douleur</span>
                <span className="text-xs text-ash font-mono hidden sm:inline">60 jours</span>
              </div>
              {loading ? <Skeleton /> : <WellbeingChart data={wellbeing} />}
              <div className="flex gap-4 mt-2 flex-wrap">
                {[['Humeur','#C8F135'],['Fatigue','#FF4E4E'],['Stress','#F5A623'],['Douleur','#A78BFA']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs font-mono text-ash">
                    <div className="w-3 h-0.5" style={{ background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'sommeil' && (
            <>
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm font-mono text-chalk">Heures de sommeil</span>
                <span className="text-xs text-ash font-mono">Ligne bleue = 8h</span>
              </div>
              {loading ? <Skeleton /> : <SleepChart data={wellbeing} />}
            </>
          )}

          {tab === 'poids' && (
            <>
              <div className="text-sm font-mono text-chalk mb-3">Poids corporel (90 jours)</div>
              {loading ? <Skeleton /> : <WeightChart data={weight} />}
            </>
          )}

          {tab === 'nutrition' && (
            <>
              <div className="text-sm font-mono text-chalk mb-3">Suppléments loggés (30 jours)</div>
              {loading ? <Skeleton /> : <SupplementChart data={supplements} />}
            </>
          )}

        </div>
      </div>
    </div>
  )
}