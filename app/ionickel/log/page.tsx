import { db } from '@/lib/ionickel/db'
import { serviceLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function ServiceLogPage() {
  const logs = await db.select().from(serviceLog).orderBy(desc(serviceLog.km))

  const totalCost = logs.reduce((sum, log) => sum + (log.cost ?? 0), 0)

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Service Log</h1>
          <p className="page-subtitle">{logs.length} workshop visits recorded</p>
        </div>
      </div>

      {/* Baseline Helper Alert if DB is empty */}
      {logs.length === 0 && (
        <div className="alert-banner" style={{ border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
          <span className="alert-banner-icon">💡</span>
          <div className="alert-banner-text">
            <strong>Car bought at 72,000 km?</strong> Set up baseline maintenance actions (60k major & 70k minor services) to calibrate the schedule trackers.
          </div>
        </div>
      )}

      {/* Total spend stats card */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card blue">
          <div className="stat-label">Total Maintenance Costs</div>
          <div className="stat-value blue">{totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          <div className="stat-sub">across all recorded logs</div>
        </div>
      </div>

      <section className="section">
        {logs.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '40px' }}>
            No service logs found. Use the seeding action above to calibrate your maintenance history.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {logs.map((log) => (
              <div 
                key={log.id} 
                style={{
                  background: 'var(--card-bg, #1a1a1a)',
                  border: '1px solid var(--border, #333)',
                  borderRadius: '10px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                      🔧 {log.km.toLocaleString('fr-FR')} km
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted, #888)' }}>
                      Date: {new Date(log.date).toLocaleDateString('fr-FR')} {log.shop && `· ${log.shop}`}
                    </p>
                  </div>
                  {log.cost && (
                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent, #3b82f6)' }}>
                      {log.cost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  )}
                </div>

                {/* Items Completed Checklist */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted, #888)', marginBottom: '6px' }}>
                    Items Completed
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(log.items as { name: string }[]).map((item, i) => (
                      <span 
                        key={i} 
                        style={{
                          fontSize: '11px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid #444',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        ✓ {item.name}
                      </span>
                    ))}
                  </div>
                </div>

                {log.notes && (
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #2a2a2a', fontSize: '13px', color: '#ccc' }}>
                    <strong>Notes:</strong> {log.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}