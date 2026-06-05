import { db } from '@/lib/ionickel/db'
import { serviceLog, tripLog, odometerLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'
import { SCHEDULE, getNextDueKm, getStatus, getProgress } from '@/lib/ionickel/schedule'
import Link from 'next/link'
import { LogActionButton } from '@/components/Ionickel/LogActionButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // ── Fetch data ──────────────────────────────────────────────────────────────
  const [logs, trips, odoRows] = await Promise.all([
    db.select().from(serviceLog).orderBy(desc(serviceLog.km)),
    db.select().from(tripLog).orderBy(desc(tripLog.date)).limit(6),
    db.select().from(odometerLog).orderBy(desc(odometerLog.km)).limit(1),
  ])

  const currentKm = odoRows[0]?.km ?? 72000

  // Build lastDoneMap: item name → km it was last serviced
  const lastDoneMap: Record<string, number> = {}
  for (const log of logs) {
    for (const item of (log.items as { name: string }[])) {
      if (!lastDoneMap[item.name]) lastDoneMap[item.name] = log.km
    }
  }

  // ── Schedule rows ───────────────────────────────────────────────────────────
  const rows = SCHEDULE.map(item => {
    const lastKm = lastDoneMap[item.name] ?? 0
    const nextKm = getNextDueKm(item, lastKm)
    const status = getStatus(nextKm, currentKm)
    const pct    = getProgress(item, lastKm, currentKm)
    return { item, lastKm, nextKm, status, pct }
  }).sort((a, b) => {
    const order = { overdue: 0, soon: 1, ok: 2, fixed: 3 } as Record<string, number>
    return order[a.status] - order[b.status]
  })

  const overdueCount = rows.filter(r => r.status === 'overdue').length
  const soonCount    = rows.filter(r => r.status === 'soon').length
  const upcoming     = rows.filter(r => r.status !== 'ok' && r.status !== 'fixed').slice(0, 5)

  // ── Trip stats ──────────────────────────────────────────────────────────────
  const totalKm   = trips.reduce((s, t) => s + t.distanceKm, 0)
  const evKm      = trips.filter(t => t.mode === 'ev').reduce((s, t) => s + t.distanceKm, 0)
  const evPct     = totalKm > 0 ? Math.round(evKm / totalKm * 100) : 0
  const recentTrips = trips.slice(0, 3)

  // ── Oil change quick stat ───────────────────────────────────────────────────
  const oilRow    = rows.find(r => r.item.id === 'oil')
  const nextOilKm = oilRow?.nextKm ?? currentKm + 15000

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Hyundai Ioniq PHEV · {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <LogActionButton currentKm={currentKm} />
      </div>

      {/* Stat grid */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">Odometer</div>
          <div className="stat-value blue">{currentKm.toLocaleString('fr-FR')}</div>
          <div className="stat-sub">km</div>
        </div>
        <div className={`stat-card ${overdueCount > 0 ? 'red' : soonCount > 0 ? 'amber' : 'green'}`}>
          <div className="stat-label">Overdue / Soon</div>
          <div className={`stat-value ${overdueCount > 0 ? 'red' : soonCount > 0 ? 'amber' : 'green'}`}>
            {overdueCount} / {soonCount}
          </div>
          <div className="stat-sub">maintenance items</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">EV share</div>
          <div className="stat-value green">{evPct}%</div>
          <div className="stat-sub">of recorded trips</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Next oil change</div>
          <div className="stat-value amber">{nextOilKm.toLocaleString('fr-FR')}</div>
          <div className="stat-sub">km</div>
        </div>
      </div>

      {/* Upcoming maintenance */}
      <section className="section">
        <div className="section-header">
          <div className="section-title">⚠ Upcoming maintenance</div>
          <Link href="/ionickel/maintenance" className="btn btn-sm btn-ghost">View all →</Link>
        </div>

        {upcoming.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>All maintenance items are up to date. ✓</p>
        ) : (
          upcoming.map(({ item, lastKm, nextKm, status, pct }) => (
            <div key={item.id} className={`maint-item ${status}`}>
              <div>
                <div className="maint-name">{item.name}</div>
                <div className="maint-meta">
                  Last: {lastKm ? `${lastKm.toLocaleString('fr-FR')} km` : '—'}
                  {' · '}Every {item.interval.toLocaleString('fr-FR')} km
                </div>
              </div>
              <div className="maint-bar-wrap">
                <div className="maint-bar">
                  <div className={`maint-fill ${status}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="maint-km-next">{nextKm.toLocaleString('fr-FR')} km</span>
              </div>
              <span className={`badge badge-${status}`}>
                {status === 'overdue' ? 'Overdue' : status === 'soon' ? 'Soon' : 'OK'}
              </span>
            </div>
          ))
        )}
      </section>

      {/* Recent trips */}
      <section className="section">
        <div className="section-header">
          <div className="section-title">🚗 Recent trips</div>
          <Link href="/ionickel/trips" className="btn btn-sm btn-ghost">View all →</Link>
        </div>

        {recentTrips.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No trips logged yet.</p>
        ) : (
          <div className="trip-grid">
            {recentTrips.map(t => (
              <div key={t.id} className="trip-card">
                <div className="trip-date">{new Date(t.date).toLocaleDateString('fr-FR')}</div>
                <div className="trip-distance">
                  {t.distanceKm}
                  <span className="trip-km-unit"> km</span>
                </div>
                <div className="trip-cons">
                  {t.mode === 'ev'
                    ? `${t.energyKwh} kWh`
                    : `${t.fuelLitres} L + ${t.energyKwh} kWh`}
                </div>
                <span className={`mode-pill mode-${t.mode}`}>
                  {t.mode === 'ev' ? '⚡ EV' : t.mode === 'hybrid' ? '⚡⛽ Hybrid' : '⛽ Petrol'}
                </span>
                {t.destination && <div className="trip-dest">{t.destination}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}