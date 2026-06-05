import { db } from '@/lib/ionickel/db'
import { serviceLog, odometerLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'
import { SCHEDULE, getNextDueKm, getStatus, getProgress } from '@/lib/ionickel/schedule'
import { LogActionButton } from '@/components/Ionickel/LogActionButton'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const [logs, odoRows] = await Promise.all([
    db.select().from(serviceLog).orderBy(desc(serviceLog.km)),
    db.select().from(odometerLog).orderBy(desc(odometerLog.km)).limit(1),
  ])

  const currentKm = odoRows[0]?.km ?? 72000

  const lastDoneMap: Record<string, number> = {}
  for (const log of logs) {
    for (const item of (log.items as { name: string }[])) {
      if (!lastDoneMap[item.name]) lastDoneMap[item.name] = log.km
    }
  }

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">{currentKm.toLocaleString('fr-FR')} km · {overdueCount} overdue · {soonCount} soon</p>
        </div>
        <LogActionButton currentKm={currentKm} />
      </div>

      {rows.map(({ item, lastKm, nextKm, status, pct }) => (
        <div key={item.id} className={`maint-item ${status}`}>
          <div>
            <div className="maint-name">{item.name}</div>
            <div className="maint-meta">
              {item.type === 'fixed'
                ? item.specialNote
                : `Last: ${lastKm ? lastKm.toLocaleString('fr-FR') + ' km' : '—'} · Interval: every ${item.interval.toLocaleString('fr-FR')} km`}
            </div>
          </div>

          <div className="maint-bar-wrap">
            {status !== 'fixed' && nextKm ? (
              <>
                <div className="maint-bar">
                  <div className={`maint-fill ${status}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="maint-km-next">{nextKm.toLocaleString('fr-FR')} km</span>
              </>
            ) : (
              <span className="maint-km-next" style={{ color: 'var(--muted2)' }}>—</span>
            )}
          </div>

          <span className={`badge badge-${status}`}>
            {status === 'overdue' ? 'Overdue'
              : status === 'soon' ? 'Soon'
              : status === 'fixed' ? 'Fixed interval'
              : 'OK'}
          </span>
        </div>
      ))}
    </div>
  )
}