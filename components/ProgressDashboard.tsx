'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Cell,
  AreaChart, Area, PieChart, Pie, Legend,
} from 'recharts'
import { format, parseISO, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) => {
  try { return format(parseISO(d), 'd MMM', { locale: fr }) } catch { return d }
}

const COLORS = ['#C8F135','#4EA8FF','#F5A623','#A78BFA','#64D8FF','#FF9F43','#FF4E4E','#26de81']

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-carbon border border-steel px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-ash mb-1.5">{fmtDate(String(label))}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="text-chalk font-bold">{typeof p.value === 'number' ? p.value.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : p.value}{p.unit ?? ''}</span>
        </div>
      ))}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="h-36 flex flex-col items-center justify-center text-zinc text-xs font-mono gap-2 border border-dashed border-zinc">
      <span className="text-xl opacity-20">📊</span>
      <span>{label}</span>
    </div>
  )
}

function Skel() { return <div className="h-36 animate-pulse bg-steel" /> }

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-slate border border-steel p-4">
      <div className="text-xs text-ash font-mono uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-3xl font-black tracking-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-zinc font-mono mt-0.5">{sub}</div>}
    </div>
  )
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-3">
      <h3 className="text-sm font-mono font-bold text-chalk uppercase tracking-wider">{children}</h3>
      {sub && <span className="text-xs font-mono text-zinc">{sub}</span>}
    </div>
  )
}

function Legend2({ items }: { items: { label: string; color: string; dash?: boolean }[] }) {
  return (
    <div className="flex gap-4 mt-2 flex-wrap">
      {items.map(({ label, color, dash }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs font-mono text-ash">
          <svg width="16" height="8">
            {dash
              ? <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
              : <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth="2" />}
          </svg>
          {label}
        </div>
      ))}
    </div>
  )
}

// ─── Individual chart components ──────────────────────────────────────────────

function WellbeingChart({ data }: { data: any[] }) {
  if (!data.length) return <Empty label="Remplis le bien-être quotidien pour voir les courbes" />
  return (
    <>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#666', fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 10]} tick={{ fill: '#666', fontSize: 10 }} />
          <Tooltip content={<Tip />} />
          <Line type="monotone" dataKey="humeur"  name="Humeur"  stroke="#C8F135" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="fatigue" name="Fatigue" stroke="#FF4E4E" strokeWidth={1.5} dot={false} strokeDasharray="3 2" connectNulls />
          <Line type="monotone" dataKey="stress"  name="Stress"  stroke="#F5A623" strokeWidth={1.5} dot={false} strokeDasharray="5 3" connectNulls />
          <Line type="monotone" dataKey="douleur_generale" name="Douleur" stroke="#A78BFA" strokeWidth={1.5} dot={false} strokeDasharray="2 2" connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <Legend2 items={[
        { label: 'Humeur', color: '#C8F135' },
        { label: 'Fatigue', color: '#FF4E4E', dash: true },
        { label: 'Stress', color: '#F5A623', dash: true },
        { label: 'Douleur', color: '#A78BFA', dash: true },
      ]} />
    </>
  )
}

function SleepChart({ data }: { data: any[] }) {
  const d = data.filter(r => r.sommeil_h != null)
  if (!d.length) return <Empty label="Aucune donnée de sommeil" />
  const avg = (d.reduce((s, r) => s + r.sommeil_h, 0) / d.length).toFixed(1)
  return (
    <>
      <div className="text-xs font-mono text-ash mb-2">Moyenne : <span className="text-chalk">{avg}h</span></div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={d} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#666', fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 12]} tick={{ fill: '#666', fontSize: 10 }} unit="h" />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={8} stroke="#4EA8FF" strokeDasharray="4 2" />
          <Bar dataKey="sommeil_h" name="Sommeil" radius={[2,2,0,0]}>
            {d.map((r, i) => <Cell key={i} fill={r.sommeil_h >= 7.5 ? '#C8F135' : r.sommeil_h >= 6 ? '#F5A623' : '#FF4E4E'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

function WeightChart({ data }: { data: any[] }) {
  if (!data.length) return <Empty label="Aucune donnée de poids" />
  const vals = data.map(d => parseFloat(d.weight_kg)).filter(Boolean)
  const min = Math.floor(Math.min(...vals)) - 1
  const max = Math.ceil(Math.max(...vals)) + 1
  const diff = vals.length > 1 ? (vals[vals.length - 1] - vals[0]).toFixed(1) : null
  return (
    <>
      {diff !== null && (
        <div className="text-xs font-mono text-ash mb-2">
          Évolution sur la période : <span style={{ color: parseFloat(diff) < 0 ? '#C8F135' : parseFloat(diff) > 0 ? '#FF4E4E' : '#888' }}>
            {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4EA8FF" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#4EA8FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#666', fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[min, max]} tick={{ fill: '#666', fontSize: 10 }} unit="kg" />
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="weight_kg" name="Poids" stroke="#4EA8FF" strokeWidth={2} fill="url(#wGrad)" dot={{ r: 3, fill: '#4EA8FF' }} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </>
  )
}

// One chart per supplement — solves the scale problem entirely
function SupplementCharts({ data, defs }: { data: any[]; defs: any[] }) {
  if (!data.length) return <Empty label="Aucun supplément logué" />

  // Group rows by supplement name
  const byName: Record<string, any[]> = {}
  data.forEach(r => {
    const key = r.name
    if (!byName[key]) byName[key] = []
    byName[key].push(r)
  })

  return (
    <div className="space-y-6">
      {Object.entries(byName).map(([name, rows], idx) => {
        const def = defs.find((d: any) => d.name === name)
        const color = COLORS[idx % COLORS.length]
        const target = def?.target ? parseFloat(def.target) : null
        const unit = def?.unit ?? rows[0]?.unit ?? ''
        const vals = rows.map(r => parseFloat(r.value)).filter(Boolean)
        const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
        const completion = target && avg ? Math.round((parseFloat(avg) / target) * 100) : null

        // Build daily chart data
        const chartData = rows
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(r => ({ date: r.date, value: parseFloat(r.value) }))

        return (
          <div key={name} className="border border-steel bg-slate p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{def?.emoji ?? '💊'}</span>
                <span className="text-sm font-mono font-bold text-chalk">{name}</span>
                <span className="text-xs font-mono text-zinc">({unit})</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                {avg && <span className="text-ash">moy: <span className="text-chalk">{avg}{unit}</span></span>}
                {target && <span className="text-ash">cible: <span style={{ color }}>{target}{unit}</span></span>}
                {completion !== null && (
                  <span className="px-1.5 py-0.5 font-bold" style={{
                    background: `${color}20`, color,
                    border: `1px solid ${color}40`
                  }}>{completion}%</span>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id={`sg${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#666', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} unit={unit.length <= 2 ? unit : ''} />
                <Tooltip content={<Tip />} />
                {target && <ReferenceLine y={target} stroke={color} strokeDasharray="4 2" strokeOpacity={0.5} />}
                <Area type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2}
                  fill={`url(#sg${idx})`} dot={{ r: 2.5, fill: color }} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}

function ActivityBreakdown({ plans }: { plans: any[] }) {
  // Count sessions and completion by activity type
  const actCount: Record<string, number> = {}
  const actDone: Record<string, number> = {}
  const actDuration: Record<string, number[]> = {}
  const actKm: Record<string, number[]> = {}

  plans.forEach(day => {
    if (!day.items?.length) return
    day.items.forEach((item: any) => {
      const key = item.activity || item.label || 'Autre'
      actCount[key] = (actCount[key] || 0) + 1
      if (item.checked) actDone[key] = (actDone[key] || 0) + 1
      if (item.duration_min) {
        if (!actDuration[key]) actDuration[key] = []
        actDuration[key].push(item.duration_min)
      }
      if (item.km) {
        if (!actKm[key]) actKm[key] = []
        actKm[key].push(item.km)
      }
    })
  })

  const chartData = Object.entries(actCount)
    .map(([name, total]) => ({
      name: name.length > 14 ? name.slice(0, 13) + '…' : name,
      fullName: name,
      total,
      done: actDone[name] || 0,
      avgKm: actKm[name]?.length
        ? parseFloat((actKm[name].reduce((a, b) => a + b, 0) / actKm[name].length).toFixed(1))
        : null,
      totalKm: actKm[name]?.length
        ? parseFloat(actKm[name].reduce((a, b) => a + b, 0).toFixed(1))
        : null,
      avgDuration: actDuration[name]?.length
        ? Math.round(actDuration[name].reduce((a, b) => a + b, 0) / actDuration[name].length)
        : null,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)

  if (!chartData.length) return <Empty label="Aucune activité planifiée" />

  return (
    <div className="space-y-4">
      {/* Bar chart: sessions planned vs done */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} width={80} />
          <Tooltip content={({ active, payload, label }: any) => {
            if (!active || !payload?.length) return null
            const row = chartData.find(d => d.name === label)
            return (
              <div className="bg-carbon border border-steel px-3 py-2 text-xs font-mono">
                <div className="text-chalk font-bold mb-1">{row?.fullName}</div>
                <div style={{ color: '#C8F135' }}>Fait : {payload.find((p:any)=>p.dataKey==='done')?.value}</div>
                <div style={{ color: '#3A3A3A' }}>Planifié : {payload.find((p:any)=>p.dataKey==='total')?.value}</div>
                {row?.avgKm && <div className="text-info mt-1">Dist. moy : {row.avgKm} km</div>}
                {row?.avgDuration && <div className="text-warn">Durée moy : {row.avgDuration} min</div>}
              </div>
            )
          }} />
          <Bar dataKey="total" name="Planifié" fill="#2A2A2A" radius={[0,2,2,0]} />
          <Bar dataKey="done"  name="Complété" fill="#C8F135" radius={[0,2,2,0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Outdoor activities with km data */}
      {chartData.filter(d => d.totalKm).length > 0 && (
        <>
          <div className="text-xs font-mono text-ash uppercase tracking-wider pt-2">Distance totale par activité</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {chartData.filter(d => d.totalKm).map((d, i) => (
              <div key={i} className="bg-carbon border border-zinc p-3">
                <div className="text-xs text-ash font-mono truncate">{d.fullName}</div>
                <div className="font-display text-2xl font-black" style={{ color: '#4EA8FF' }}>{d.totalKm} km</div>
                <div className="text-xs text-zinc font-mono">moy {d.avgKm} km · {d.done} sorties</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ActivityTimeline({ plans }: { plans: any[] }) {
  // Completed items per day
  const byDate = plans
    .filter(d => d.items?.some((i: any) => i.checked))
    .map(d => ({
      date: d.date,
      done: d.items.filter((i: any) => i.checked).length,
      total: d.items.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!byDate.length) return <Empty label="Coche des tâches pour voir la timeline" />

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={byDate} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#666', fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#666', fontSize: 10 }} allowDecimals={false} />
        <Tooltip content={({ active, payload, label }: any) => {
          if (!active || !payload?.length) return null
          const done = payload.find((p:any)=>p.dataKey==='done')?.value
          const total = payload.find((p:any)=>p.dataKey==='total')?.value
          return (
            <div className="bg-carbon border border-steel px-3 py-2 text-xs font-mono">
              <div className="text-ash mb-1">{fmtDate(label)}</div>
              <div style={{ color: '#C8F135' }}>{done}/{total} tâches</div>
            </div>
          )
        }} />
        <Bar dataKey="total" name="Planifié" fill="#2A2A2A" radius={[2,2,0,0]} />
        <Bar dataKey="done"  name="Fait"     fill="#C8F135" radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Period = 30 | 90 | 180

export function ProgressDashboard() {
  const [period, setPeriod] = useState<Period>(90)
  const [loading, setLoading] = useState(true)
  const [wellbeing, setWellbeing] = useState<any[]>([])
  const [weight, setWeight] = useState<any[]>([])
  const [suppLogs, setSuppLogs] = useState<any[]>([])
  const [suppDefs, setSuppDefs] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    setLoading(true)
    const from = subDays(new Date(), period).toISOString().split('T')[0]
    const to   = new Date().toISOString().split('T')[0]

    Promise.all([
      fetch(`/api/wellbeing?days=${period}`).then(r => r.json()).catch(() => []),
      fetch(`/api/metrics?days=${period}`).then(r => r.json()).catch(() => []),
      fetch(`/api/supplement-logs?days=${period}`).then(r => r.json()).catch(() => []),
      fetch(`/api/supplements`).then(r => r.json()).catch(() => []),
      fetch(`/api/day-plan/week?from=${from}&to=${to}`).then(r => r.json()).catch(() => ({})),
    ]).then(([wb, wt, sl, sd, plansMap]) => {
      setWellbeing(Array.isArray(wb) ? wb.sort((a:any,b:any) => a.date.localeCompare(b.date)) : [])
      setWeight(Array.isArray(wt) ? wt : [])
      setSuppLogs(Array.isArray(sl) ? sl : [])
      setSuppDefs(Array.isArray(sd) ? sd : [])
      const arr = plansMap && !plansMap.error
        ? Object.entries(plansMap).map(([date, p]: [string, any]) => ({ date: date.split('T')[0], ...p }))
        : []
      setPlans(arr.sort((a: any, b: any) => a.date.localeCompare(b.date)))
    }).finally(() => setLoading(false))
  }, [period])

  // Summary stats
  const latestWeight = weight.length ? parseFloat(weight[weight.length - 1]?.weight_kg) : null
  const weightDiff = weight.length > 1
    ? parseFloat((parseFloat(weight[weight.length-1]?.weight_kg) - parseFloat(weight[0]?.weight_kg)).toFixed(1))
    : null
  const avgMood = useMemo(() => {
    const d = wellbeing.filter(r => r.humeur != null)
    return d.length ? (d.reduce((s, r) => s + r.humeur, 0) / d.length).toFixed(1) : null
  }, [wellbeing])
  const avgSleep = useMemo(() => {
    const d = wellbeing.filter(r => r.sommeil_h != null)
    return d.length ? (d.reduce((s, r) => s + parseFloat(r.sommeil_h), 0) / d.length).toFixed(1) : null
  }, [wellbeing])
  const totalDone = useMemo(() =>
    plans.reduce((s, d) => s + (d.items?.filter((i:any) => i.checked).length ?? 0), 0)
  , [plans])

  const hasSuppData = suppLogs.length > 0
  const hasActivityData = plans.some(d => d.items?.length > 0)
  const hasWellbeingData = wellbeing.length > 0
  const hasWeightData = weight.length > 0

  const periodLabel = { 30: '30 jours', 90: '90 jours', 180: '6 mois' }[period]

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-ash">Période d'analyse</div>
        <div className="flex border border-steel">
          {([30, 90, 180] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-mono transition-all ${
                period === p ? 'bg-accent text-carbon font-bold' : 'text-ash hover:text-chalk'
              }`}>
              {p === 30 ? '30j' : p === 90 ? '90j' : '6m'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Poids actuel"
          value={latestWeight ? `${latestWeight} kg` : '—'}
          sub={weightDiff !== null ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg sur ${periodLabel}` : undefined}
          color="#4EA8FF" />
        <StatCard label="Humeur moy."
          value={avgMood ? `${avgMood}/10` : '—'}
          color="#C8F135" />
        <StatCard label="Sommeil moy."
          value={avgSleep ? `${avgSleep}h` : '—'}
          color="#A78BFA" />
        <StatCard label="Tâches faites"
          value={String(totalDone)}
          sub={`sur ${periodLabel}`}
          color="#F5A623" />
      </div>

      {/* ── BIEN-ÊTRE ── */}
      {hasWellbeingData && (
        <div className="bg-slate border border-steel p-5">
          <SectionTitle sub={periodLabel}>🌡 Bien-être quotidien</SectionTitle>
          {loading ? <Skel /> : <WellbeingChart data={wellbeing} />}
        </div>
      )}

      {/* ── SOMMEIL ── */}
      {hasWellbeingData && (
        <div className="bg-slate border border-steel p-5">
          <SectionTitle sub="Vert ≥7.5h · Orange ≥6h · Rouge &lt;6h">😴 Sommeil</SectionTitle>
          {loading ? <Skel /> : <SleepChart data={wellbeing} />}
        </div>
      )}

      {/* ── POIDS ── */}
      {hasWeightData && (
        <div className="bg-slate border border-steel p-5">
          <SectionTitle sub={periodLabel}>⚖ Poids corporel</SectionTitle>
          {loading ? <Skel /> : <WeightChart data={weight} />}
        </div>
      )}

      {/* ── SUPPLÉMENTS — one card per supplement ── */}
      {(hasSuppData || !loading) && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h3 className="text-sm font-mono font-bold text-chalk uppercase tracking-wider">🥗 Suppléments</h3>
            <span className="text-xs font-mono text-zinc">{periodLabel} · un graphique par supplément</span>
          </div>
          {loading ? <Skel /> : (
            hasSuppData
              ? <SupplementCharts data={suppLogs} defs={suppDefs} />
              : <Empty label="Aucun supplément logué sur la période" />
          )}
        </div>
      )}

      {/* ── ACTIVITÉS BREAKDOWN ── */}
      {hasActivityData && (
        <div className="bg-slate border border-steel p-5">
          <SectionTitle sub={`${periodLabel} · vert = complété`}>💪 Répartition des activités</SectionTitle>
          {loading ? <Skel /> : <ActivityBreakdown plans={plans} />}
        </div>
      )}

      {/* ── TIMELINE ACTIVITÉ ── */}
      {hasActivityData && (
        <div className="bg-slate border border-steel p-5">
          <SectionTitle sub={periodLabel}>📅 Timeline — tâches par jour</SectionTitle>
          {loading ? <Skel /> : <ActivityTimeline plans={plans} />}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasWellbeingData && !hasWeightData && !hasSuppData && !hasActivityData && (
        <div className="border border-dashed border-zinc p-12 text-center space-y-3">
          <div className="text-4xl opacity-20">📊</div>
          <div className="text-chalk text-sm font-mono">Pas encore de données</div>
          <div className="text-ash text-xs font-mono">Utilise l'app quelques jours pour voir tes stats apparaître ici.</div>
        </div>
      )}
    </div>
  )
}
