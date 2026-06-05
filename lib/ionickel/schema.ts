import { pgTable, serial, integer, text, date, real, jsonb, timestamp } from 'drizzle-orm/pg-core'

// ── Service log ──────────────────────────────────────────────────────────────
// Each row is one workshop visit or DIY session.
// `items` is a JSON array of { name: string, category: string } objects.
export const serviceLog = pgTable('ionickel_service_log', {
  id:        serial('id').primaryKey(),
  km:        integer('km').notNull(),
  date:      date('date').notNull(),
  items:     jsonb('items').notNull().default([]),   // { name, category }[]
  cost:      real('cost'),                           // euros
  shop:      text('shop'),                           // workshop / location
  notes:     text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})

// ── Trip log ─────────────────────────────────────────────────────────────────
// Each row is one trip. mode: 'ev' | 'hybrid' | 'petrol'
export const tripLog = pgTable('ionickel_trip_log', {
  id:          serial('id').primaryKey(),
  date:        date('date').notNull(),
  distanceKm:  real('distance_km').notNull(),
  mode:        text('mode').notNull().default('hybrid'), // ev | hybrid | petrol
  fuelLitres:  real('fuel_litres').notNull().default(0),
  energyKwh:   real('energy_kwh').notNull().default(0),
  destination: text('destination'),
  createdAt:   timestamp('created_at').defaultNow(),
})

// ── Odometer snapshots ───────────────────────────────────────────────────────
// Stores the most recent odometer reading so we don't hardcode it.
export const odometerLog = pgTable('ionickel_odometer', {
  id:        serial('id').primaryKey(),
  km:        integer('km').notNull(),
  date:      date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export type ServiceLog    = typeof serviceLog.$inferSelect
export type NewServiceLog = typeof serviceLog.$inferInsert
export type TripLog       = typeof tripLog.$inferSelect
export type NewTripLog    = typeof tripLog.$inferInsert
export type OdometerLog   = typeof odometerLog.$inferSelect