export type ScheduleType = 'interval' | 'fixed' | 'special'

export type ScheduleItem = {
  id: string
  name: string
  type: ScheduleType
  // For interval items: action at each checkpoint
  inspectEveryKm?: number
  replaceEveryKm?: number
  inspectEveryMonths?: number
  replaceEveryMonths?: number
  // For fixed items
  fixedReplaceKm?: number
  fixedReplaceMonths?: number
  // For special text
  specialNote?: string
  diyAvailable: boolean
  category: 'engine' | 'brakes' | 'transmission' | 'cooling' | 'hybrid' | 'chassis' | 'filters' | 'electrical'
}

export const SCHEDULE: ScheduleItem[] = [
  {
    id: 'engine-oil',
    name: 'Engine oil + filter',
    type: 'interval',
    replaceEveryKm: 15000,
    replaceEveryMonths: 12,
    diyAvailable: true,
    category: 'engine',
  },
  {
    id: 'air-cleaner',
    name: 'Air cleaner filter',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    replaceEveryKm: 30000,
    replaceEveryMonths: 24,
    diyAvailable: true,
    category: 'filters',
  },
  {
    id: 'fuel-additives',
    name: 'Fuel additives',
    type: 'interval',
    replaceEveryKm: 15000,
    replaceEveryMonths: 12,
    diyAvailable: true,
    category: 'engine',
  },
  {
    id: 'spark-plugs',
    name: 'Spark plugs',
    type: 'fixed',
    fixedReplaceKm: 165000,
    diyAvailable: false,
    category: 'engine',
  },
  {
    id: 'vapor-hose-filler-cap',
    name: 'Vapor hose + fuel filler cap',
    type: 'interval',
    inspectEveryKm: 60000,
    inspectEveryMonths: 48,
    diyAvailable: false,
    category: 'engine',
  },
  {
    id: 'fuel-tank-air-filter',
    name: 'Fuel tank air filter',
    type: 'interval',
    inspectEveryKm: 60000,
    inspectEveryMonths: 48,
    diyAvailable: false,
    category: 'filters',
  },
  {
    id: 'vacuum-hose',
    name: 'Vacuum hose',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'engine',
  },
  {
    id: 'fuel-filter',
    name: 'Fuel filter',
    type: 'interval',
    inspectEveryKm: 60000,
    inspectEveryMonths: 48,
    specialNote: 'Maintenance-free but inspect periodically',
    diyAvailable: false,
    category: 'engine',
  },
  {
    id: 'fuel-lines',
    name: 'Fuel lines, hoses and connections',
    type: 'interval',
    inspectEveryKm: 60000,
    inspectEveryMonths: 48,
    diyAvailable: false,
    category: 'engine',
  },
  {
    id: 'hsg-belt',
    name: 'HSG (Hybrid Starter & Generator) belt',
    type: 'special',
    specialNote: 'Inspect every 15,000 km / 12 months. Replace at 105,000 km / 48 months.',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    replaceEveryKm: 105000,
    replaceEveryMonths: 48,
    diyAvailable: false,
    category: 'hybrid',
  },
  {
    id: 'cooling-system',
    name: 'Cooling system',
    type: 'special',
    specialNote: 'Inspect coolant level/leaks daily. Full inspection: first at 60,000 km / 48 months, then every 30,000 km / 24 months.',
    inspectEveryKm: 30000,
    inspectEveryMonths: 24,
    diyAvailable: false,
    category: 'cooling',
  },
  {
    id: 'engine-coolant',
    name: 'Engine coolant / inverter coolant',
    type: 'special',
    specialNote: 'First replace at 210,000 km / 120 months, then every 30,000 km / 24 months.',
    replaceEveryKm: 210000,
    replaceEveryMonths: 120,
    diyAvailable: false,
    category: 'cooling',
  },
  {
    id: 'dct-fluid',
    name: 'Dual clutch transmission (DCT) fluid',
    type: 'interval',
    inspectEveryKm: 60000,
    inspectEveryMonths: 48,
    diyAvailable: false,
    category: 'transmission',
  },
  {
    id: 'clutch-actuator-fluid',
    name: 'Engine clutch actuator fluid',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    replaceEveryKm: 30000,
    replaceEveryMonths: 24,
    diyAvailable: false,
    category: 'hybrid',
  },
  {
    id: 'clutch-actuator-hose',
    name: 'Engine clutch actuator hose and line',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'hybrid',
  },
  {
    id: 'battery-12v',
    name: '12V battery condition',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: true,
    category: 'electrical',
  },
  {
    id: 'brake-lines',
    name: 'Brake lines, hoses and connections',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'brakes',
  },
  {
    id: 'brake-pedal',
    name: 'Brake pedal',
    type: 'interval',
    inspectEveryKm: 30000,
    inspectEveryMonths: 24,
    diyAvailable: false,
    category: 'brakes',
  },
  {
    id: 'parking-brake',
    name: 'Parking brake',
    type: 'interval',
    inspectEveryKm: 30000,
    inspectEveryMonths: 24,
    diyAvailable: false,
    category: 'brakes',
  },
  {
    id: 'brake-fluid',
    name: 'Brake fluid',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    replaceEveryKm: 30000,
    replaceEveryMonths: 24,
    diyAvailable: true,
    category: 'brakes',
  },
  {
    id: 'brake-discs-pads',
    name: 'Brake discs and pads',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'brakes',
  },
  {
    id: 'steering-gear',
    name: 'Steering gear rack, linkage and boots',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'chassis',
  },
  {
    id: 'driveshaft',
    name: 'Driveshaft and boots',
    type: 'interval',
    inspectEveryKm: 30000,
    inspectEveryMonths: 24,
    diyAvailable: false,
    category: 'chassis',
  },
  {
    id: 'tyre-pressure',
    name: 'Tyre pressure and tread wear',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: true,
    category: 'chassis',
  },
  {
    id: 'suspension-ball-joints',
    name: 'Front suspension ball joints',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'chassis',
  },
  {
    id: 'chassis-bolts',
    name: 'Bolt and nuts on chassis and body',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'chassis',
  },
  {
    id: 'ac-refrigerant',
    name: 'Air conditioner refrigerant',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'filters',
  },
  {
    id: 'ac-compressor',
    name: 'Air conditioner compressor',
    type: 'interval',
    inspectEveryKm: 15000,
    inspectEveryMonths: 12,
    diyAvailable: false,
    category: 'filters',
  },
  {
    id: 'cabin-filter',
    name: 'Climate control air filter (cabin)',
    type: 'interval',
    replaceEveryKm: 30000,
    replaceEveryMonths: 24,
    diyAvailable: true,
    category: 'filters',
  },
  {
    id: 'exhaust-system',
    name: 'Exhaust system',
    type: 'interval',
    inspectEveryKm: 30000,
    inspectEveryMonths: 24,
    diyAvailable: false,
    category: 'engine',
  },
]

export function getNextDueKm(item: ScheduleItem, lastKm: number): number | null {
  if (item.type === 'fixed') return item.fixedReplaceKm ?? null
  if (item.replaceEveryKm) return lastKm + item.replaceEveryKm
  if (item.inspectEveryKm) return lastKm + item.inspectEveryKm
  return null
}

export function getStatus(nextKm: number | null, currentKm: number): 'ok' | 'soon' | 'due' | 'fixed' {
  if (!nextKm) return 'fixed'
  const diff = nextKm - currentKm
  if (diff <= 0) return 'due'
  if (diff <= 3000) return 'soon'
  return 'ok'
}
