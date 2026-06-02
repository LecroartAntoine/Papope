import { db } from '@/lib/ionickel/db'
import { serviceLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'
import { SCHEDULE, getNextDueKm, getStatus } from '@/lib/ionickel/schedule'
import Link from 'next/link'

const CURRENT_KM = 72000

const STATUS_LABELS = {
  due: { label: 'Overdue', className: 'badge-due' },
  soon: { label: 'Due soon', className: 'badge-soon' },
  ok: { label: 'OK', className: 'badge-ok' },
  fixed: { label: 'Fixed interval', className: 'badge-fixed' },
}

export default async function MaintenancePage() {
  const logs = await db.select().from(serviceLog).orderBy(desc(serviceLog.km))

  // Build a map: itemName → last km it was done
  const lastDoneMap: Record<string, number> = {}
  for (const log of logs) {
    for (const item of log.items as { name: string }[]) {
      if (!lastDoneMap[item.name]) {
        lastDoneMap[item.name] = log.km
      }
    }
  }

  const rows = SCHEDULE.map((item) => {
    const lastKm = lastDoneMap[item.name] ?? 0
    const nextKm = getNextDueKm(item, lastKm)
    const status = getStatus(nextKm, CURRENT_KM)
    const pct = nextKm
      ? Math.min(100, Math.max(0, Math.round(((CURRENT_KM - lastKm) / (nextKm - lastKm)) * 100)))
      : 0
    return { item, lastKm, nextKm, status, pct }
  }).sort((a, b) => {
    const order = { due: 0, soon: 1, ok: 2, fixed: 3 }
    return order[a.status] - order[b.status]
  })

  const dueCount = rows.filter((r) => r.status === 'due').length
  const soonCount = rows.filter((r) => r.status === 'soon').length

  return (
    <main className="container">
      <header className="page-header">
        <div>
          <h1>Hyundai Ioniq PHEV</h1>
          <p className="subtitle">2021 · Maintenance tracker</p>
        </div>
        <nav className="top-nav">
          <Link href="/ionickel" className="nav-link active">Dashboard</Link>
          <Link href="/ionickel/log" className="nav-link">Service log</Link>
          <Link href="/" className="nav-link">← Back</Link>
        </nav>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Current km</div>
          <div className="stat-value">{CURRENT_KM.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Last oil change</div>
          <div className="stat-value stat-ok">72 000 km</div>
        </div>
        <div className="stat">
          <div className="stat-label">Next oil change</div>
          <div className="stat-value stat-warn">87 000 km</div>
        </div>
        <div className="stat">
          <div className="stat-label">Items overdue / soon</div>
          <div className={`stat-value ${dueCount > 0 ? 'stat-due' : soonCount > 0 ? 'stat-warn' : 'stat-ok'}`}>
            {dueCount} / {soonCount}
          </div>
        </div>
      </div>

      <section>
        <h2 className="section-title">All maintenance items</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Last done</th>
                <th>Next due</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, lastKm, nextKm, status, pct }) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{lastKm ? `${lastKm.toLocaleString()} km` : '—'}</td>
                  <td>
                    {item.type === 'special'
                      ? <span className="muted">{item.specialNote}</span>
                      : nextKm
                        ? `${nextKm.toLocaleString()} km`
                        : '—'}
                  </td>
                  <td>
                    {status !== 'fixed' && nextKm ? (
                      <div className="progress-bar">
                        <div
                          className={`progress-fill progress-${status}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_LABELS[status].className}`}>
                      {STATUS_LABELS[status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
