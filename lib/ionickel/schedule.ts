// Maintenance schedule for Hyundai Ioniq PHEV 2021
// All intervals are in kilometres unless type === 'fixed'.

export type ScheduleStatus = 'overdue' | 'soon' | 'ok' | 'fixed'

export interface ScheduleItem {
  id:          string
  name:        string
  interval:    number   // km between services
  type:        'km' | 'fixed'
  specialNote?: string  // used when type === 'fixed'
}

export const SCHEDULE: ScheduleItem[] = [
  { id: 'oil',         name: 'Engine oil & filter',       interval: 15000, type: 'km' },
  { id: 'cabin',       name: 'Cabin air filter',           interval: 20000, type: 'km' },
  { id: 'air',         name: 'Engine air filter',          interval: 30000, type: 'km' },
  { id: 'tyres',       name: 'Tyre rotation',              interval: 10000, type: 'km' },
  { id: 'brake_fluid', name: 'Brake fluid',                interval: 30000, type: 'km' },
  { id: 'spark',       name: 'Spark plugs',                interval: 60000, type: 'km' },
  { id: 'coolant',     name: 'Coolant flush',              interval: 60000, type: 'km' },
  { id: 'wipers',      name: 'Wiper blades',               interval: 20000, type: 'km' },
  { id: '12v',         name: '12V battery check',          interval: 25000, type: 'km' },
  { id: 'brake_pads',  name: 'Brake pad inspection',       interval: 20000, type: 'km' },
  { id: 'hvbattery',   name: 'HV battery health check',    interval: 50000, type: 'km' },
  { id: 'transmission',name: 'Transmission fluid',         interval: 60000, type: 'km' },
  { id: 'evap',        name: 'A/C evaporator & refrigerant', interval: 40000, type: 'km' },
  // Fixed-interval items (not km-based)
  { id: 'timing',      name: 'Timing belt',                interval: 0,     type: 'fixed',
    specialNote: 'Every 5 years or 100 000 km' },
]

/** km at which this item is next due, given the last km it was done */
export function getNextDueKm(item: ScheduleItem, lastKm: number): number {
  if (item.type === 'fixed') return 0
  return lastKm + item.interval
}

/** How far along the interval we are, 0–100 */
export function getProgress(item: ScheduleItem, lastKm: number, currentKm: number): number {
  if (item.type === 'fixed') return 0
  const nextKm = getNextDueKm(item, lastKm)
  return Math.min(100, Math.max(0,
    Math.round(((currentKm - lastKm) / item.interval) * 100)
  ))
}

/** Urgency status */
export function getStatus(nextKm: number, currentKm: number): ScheduleStatus {
  if (nextKm === 0) return 'fixed'
  const diff = nextKm - currentKm
  if (diff <= 0)    return 'overdue'
  if (diff <= 3000) return 'soon'
  return 'ok'
}