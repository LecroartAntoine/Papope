import { db } from '@/lib/ionickel/db'
import { tripLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function FuelPage() {
  const trips = await db.select().from(tripLog).orderBy(desc(tripLog.date))

  // Calculations
  const totalKm = trips.reduce((sum, t) => sum + t.distanceKm, 0)
  const totalFuel = trips.reduce((sum, t) => sum + t.fuelLitres, 0)
  const totalElectricity = trips.reduce((sum, t) => sum + t.energyKwh, 0)

  const evKm = trips.filter(t => t.mode === 'ev').reduce((sum, t) => sum + t.distanceKm, 0)
  const hybridKm = trips.filter(t => t.mode === 'hybrid').reduce((sum, t) => sum + t.distanceKm, 0)
  const petrolKm = trips.filter(t => t.mode === 'petrol').reduce((sum, t) => sum + t.distanceKm, 0)

  const evRatio = totalKm > 0 ? Math.round((evKm / totalKm) * 100) : 0

  // Calculate real metrics
  const nonEvKm = hybridKm + petrolKm
  const avgFuelL100 = nonEvKm > 0 ? (totalFuel / nonEvKm) * 100 : 0
  const avgElecKwh100 = (evKm + hybridKm) > 0 ? (totalElectricity / (evKm + hybridKm)) * 100 : 0

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fuel & Energy Analytics</h1>
        <p className="page-subtitle">PHEV Efficiency metrics calculated from {trips.length} trips</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card green">
          <div className="stat-label">EV Distance Share</div>
          <div className="stat-value green">{evRatio}%</div>
          <div className="stat-sub">{evKm.toLocaleString('fr-FR')} km pure electric</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Hybrid Fuel Cons.</div>
          <div className="stat-value amber">{avgFuelL100.toFixed(2)}</div>
          <div className="stat-sub">L / 100 km (non-EV trips)</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Electricity Cons.</div>
          <div className="stat-value blue">{avgElecKwh100.toFixed(1)}</div>
          <div className="stat-sub">kWh / 100 km (EV & Hybrid)</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Resources</div>
          <div className="stat-value green">{totalFuel.toFixed(1)} L</div>
          <div className="stat-sub">& {totalElectricity.toFixed(1)} kWh consumed</div>
        </div>
      </div>

      <section className="section" style={{ marginTop: '24px' }}>
        <h2 className="section-title">Distance Split by Mode</h2>
        <div style={{ display: 'flex', gap: '4px', height: '24px', borderRadius: '6px', overflow: 'hidden', margin: '16px 0' }}>
          {evKm > 0 && <div style={{ width: `${(evKm / totalKm) * 100}%`, backgroundColor: '#10b981' }} title={`EV: ${evKm} km`} />}
          {hybridKm > 0 && <div style={{ width: `${(hybridKm / totalKm) * 100}%`, backgroundColor: '#3b82f6' }} title={`Hybrid: ${hybridKm} km`} />}
          {petrolKm > 0 && <div style={{ width: `${(petrolKm / totalKm) * 100}%`, backgroundColor: '#f59e0b' }} title={`Petrol: ${petrolKm} km`} />}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted, #888)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            EV: {evKm.toLocaleString('fr-FR')} km
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            Hybrid: {hybridKm.toLocaleString('fr-FR')} km
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            Petrol: {petrolKm.toLocaleString('fr-FR')} km
          </span>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Consumption History</h2>
        {trips.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No recorded logs to show.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #333)', color: 'var(--muted, #888)' }}>
                <th style={{ padding: '8px 4px' }}>Date</th>
                <th style={{ padding: '8px 4px' }}>Destination</th>
                <th style={{ padding: '8px 4px' }}>Distance</th>
                <th style={{ padding: '8px 4px' }}>Fuel (L)</th>
                <th style={{ padding: '8px 4px' }}>Power (kWh)</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Mode</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '8px 4px' }}>{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '8px 4px', color: '#ccc' }}>{t.destination || '—'}</td>
                  <td style={{ padding: '8px 4px' }}>{t.distanceKm} km</td>
                  <td style={{ padding: '8px 4px', color: t.fuelLitres > 0 ? '#f59e0b' : '#666' }}>
                    {t.fuelLitres > 0 ? `${t.fuelLitres.toFixed(1)} L` : '0 L'}
                  </td>
                  <td style={{ padding: '8px 4px', color: t.energyKwh > 0 ? '#10b981' : '#666' }}>
                    {t.energyKwh > 0 ? `${t.energyKwh.toFixed(1)} kWh` : '0 kWh'}
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                    <span className={`badge badge-${t.mode}`} style={{ fontSize: '11px', padding: '2px 6px' }}>
                      {t.mode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}