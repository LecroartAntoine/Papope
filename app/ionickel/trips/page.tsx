import { db } from '@/lib/ionickel/db'
import { tripLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'
import { LogTripButton } from '@/components/Ionickel/LogTripButton'

export const dynamic = 'force-dynamic'

export default async function TripsPage() {
  const trips = await db.select().from(tripLog).orderBy(desc(tripLog.date))

  const totalKm   = trips.reduce((s, t) => s + t.distanceKm, 0)
  const totalFuel = trips.reduce((s, t) => s + t.fuelLitres, 0)
  const evTrips   = trips.filter(t => t.mode === 'ev').length
  const avgConsumption = totalKm > 0 ? (totalFuel / totalKm * 100) : 0

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trips</h1>
          <p className="page-subtitle">{trips.length} trips logged</p>
        </div>
        <LogTripButton />
      </div>

      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total distance</div>
          <div className="stat-value blue">{totalKm.toLocaleString('fr-FR')}</div>
          <div className="stat-sub">km recorded</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">EV trips</div>
          <div className="stat-value green">{evTrips}</div>
          <div className="stat-sub">of {trips.length} total</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Fuel consumed</div>
          <div className="stat-value amber">{totalFuel.toFixed(1)}</div>
          <div className="stat-sub">litres total</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Avg. consumption</div>
          <div className="stat-value green">{avgConsumption.toFixed(1)}</div>
          <div className="stat-sub">L / 100 km</div>
        </div>
      </div>

      {trips.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>No trips yet — log your first trip above.</p>
      ) : (
        <div className="trip-grid">
          {trips.map(t => (
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
    </div>
  )
}