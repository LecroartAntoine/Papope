# Ionickel Implementation Summary

## Overview

Ionickel is a full-featured Hyundai Ioniq PHEV 2021 maintenance tracker integrated into the Papope app. It's built with Drizzle ORM + Neon Postgres and provides:

- **Dashboard**: View all maintenance items with status, due dates, and progress
- **Service Log**: Complete maintenance history with timestamps
- **Maintenance Schedule**: 30+ items covering engine, brakes, transmission, cooling, hybrid, chassis, filters, and electrical systems
- **Pre-seeded History**: 5 service entries from 15,000 km to 72,000 km

---

## Architecture

### Directory Structure

```
app/ionickel/
  layout.tsx           ← Async layout with requireAccess('ionickel')
  page.tsx             ← Dashboard page
  globals.css          ← Ionickel-specific styling
  ionickel.module.css  ← Empty (ready for future expansion)

app/api/ionickel/
  route.ts             ← GET/POST maintenance logs

lib/ionickel/
  db.ts                ← Drizzle DB instance
  schema.ts            ← serviceLog table definition
  schedule.ts          ← Maintenance schedule + helper functions
  seed.ts              ← Seeding script

drizzle.config.ts      ← Drizzle Kit configuration
```

### Database Schema

```sql
CREATE TABLE ionickel_service_log (
  id        SERIAL PRIMARY KEY,
  km        INTEGER NOT NULL,
  date      DATE NOT NULL,
  items     JSONB NOT NULL,
  notes     TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
)
```

**Items format**:
```typescript
type ServiceItem = {
  name: string
  action: 'R' | 'I' | 'replaced' | 'topped-up' | 'adjusted'
  notes?: string
}
```

---

## Stack

- **ORM**: Drizzle ORM (type-safe, serverless-compatible)
- **Database**: Neon Postgres (free tier available)
- **API**: Next.js Route Handlers
- **Frontend**: Server components + CSS

---

## Setup Instructions

### 1. Environment Variable

Ensure `DATABASE_URL` is set in `.env.local` (already configured for your Papope Vercel Postgres):

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

### 2. Create Database Tables

Run Drizzle migrations:

```bash
npx drizzle-kit push:pg
```

This reads `drizzle.config.ts` and creates the `ionickel_service_log` table.

### 3. Seed Historical Data

Run the seed script to populate your maintenance history:

```bash
npx tsx lib/ionickel/seed.ts
```

This inserts 5 service entries:
- 15,000 km (June 2022)
- 30,000 km (April 2023)
- 45,000 km (February 2024)
- 60,000 km (March 2025)
- 72,000 km (June 2026) — current

### 4. Access Ionickel

Navigate to `/ionickel` (logged in users with `ionickel` access will see the maintenance dashboard).

---

## Features

### Dashboard (`/ionickel`)

Displays:
- **Stats grid**: Current km, last oil change, next oil change, overdue/soon items
- **Maintenance table**: All 30+ items with:
  - Last done (km)
  - Next due (km)
  - Progress bar
  - Status badge (Overdue / Due soon / OK / Fixed interval)

Items are sorted by status (due first, then soon, then ok).

### Maintenance Schedule

Coverage includes:

| Category | Items |
|----------|-------|
| **Engine** | Oil+filter, Spark plugs, Fuel additives, Vapor hose, Fuel filter/lines, Exhaust |
| **Brakes** | Brake lines, Pedal, Parking brake, Fluid, Discs+pads |
| **Transmission** | DCT fluid |
| **Cooling** | Cooling system, Engine coolant |
| **Hybrid** | HSG belt, Clutch actuator (fluid/hose) |
| **Electrical** | 12V battery |
| **Chassis** | Steering gear, Driveshaft, Tyres, Suspension, Bolts |
| **Filters** | Air cleaner, Cabin, AC refrigerant/compressor |

### Status Logic

- **Overdue**: Next due km ≤ current km
- **Due soon**: Current km + 3,000 km or less until next due
- **OK**: More than 3,000 km away
- **Fixed interval**: One-time service (e.g., spark plugs at 165,000 km)

### API

#### GET `/api/ionickel`

Returns all service log entries sorted by km (descending).

```json
[
  {
    "id": 1,
    "km": 72000,
    "date": "2026-06-02",
    "items": [...],
    "notes": "Oil change done + 12V battery replaced",
    "createdAt": "2026-06-02T..."
  }
]
```

#### POST `/api/ionickel`

Create a new service entry.

```bash
curl -X POST http://localhost:3000/api/ionickel \
  -H "Content-Type: application/json" \
  -d '{
    "km": 75000,
    "date": "2026-09-01",
    "notes": "Routine inspection",
    "items": [
      { "name": "Engine oil + filter", "action": "I" },
      { "name": "Brake fluid", "action": "I" }
    ]
  }'
```

---

## Access Control

Ionickel is a **private section** — only users with `ionickel` access can view it.

- Unauthenticated users: redirected to `/login`
- Authenticated users without access: redirected to `/`
- Authenticated users with access: full dashboard visibility

Access is controlled via the layout's `requireAccess('ionickel')` guard (set in `app/ionickel/layout.tsx`).

---

## Styling

All styling is contained in `app/ionickel/globals.css` using a clean, minimal design system:

- **Color scheme**: Warm beige background (#f8f7f5) with surfaces and borders
- **Status colors**: Green (ok), Orange (soon), Red (due), Blue (info)
- **Responsive**: Works on desktop and mobile
- **Print-friendly**: Optimized for printing service logs

---

## Current State (72,000 km)

### Done
- ✅ Engine oil + filter (done at 72,000 km)
- ✅ 12V battery (replaced at 72,000 km)

### Due Soon (by ~75,000 km)
- ⚠️ Vacuum hose inspection
- ⚠️ HSG belt inspection
- ⚠️ Brake lines/hoses inspection

### Coming Up (by ~90,000 km)
- Air cleaner filter (replace)
- Brake fluid (replace)
- Cabin filter (replace)
- Clutch actuator fluid (replace)

---

## Future Expansion

The foundation supports:

1. **Service log page** — detailed view of all past entries
2. **Add new entry form** — UI to log maintenance
3. **DIY guides** — step-by-step repair tutorials
4. **Reminders** — email/SMS notifications when due
5. **Multiple vehicles** — track different cars
6. **Export** — PDF/CSV reports
7. **Analytics** — cost tracking, failure prediction

---

## Files Created

### Core Infrastructure
- `lib/ionickel/db.ts` — Drizzle DB instance
- `lib/ionickel/schema.ts` — Postgres table definition
- `drizzle.config.ts` — Drizzle Kit config

### Business Logic
- `lib/ionickel/schedule.ts` — Maintenance schedule + helpers
- `lib/ionickel/seed.ts` — Historical data seeder

### API
- `app/api/ionickel/route.ts` — GET/POST maintenance logs

### Frontend
- `app/ionickel/layout.tsx` — Root layout with access guard
- `app/ionickel/page.tsx` — Dashboard (server component)
- `app/ionickel/globals.css` — Styling
- `app/ionickel/ionickel.module.css` — CSS module (placeholder)

---

## Dependencies Added

```json
{
  "@neondatabase/serverless": "latest",
  "drizzle-orm": "latest",
  "drizzle-kit": "latest",
  "dotenv": "latest",
  "tsx": "latest"
}
```

---

## Running Locally

```bash
# Install dependencies (already done)
npm install

# Create DB tables
npx drizzle-kit push:pg

# Seed historical data
npx tsx lib/ionickel/seed.ts

# Start dev server
npm run dev

# Visit http://localhost:3000/ionickel
```

---

## Notes

- **Current km**: Hardcoded in `page.tsx` as `CURRENT_KM = 72000`. Can be moved to DB in future.
- **Last done tracking**: Built from service log history — no separate tracking table needed.
- **Status calculation**: Real-time based on current km vs. next due km.
- **Timezone**: All dates stored as ISO strings, front-end displays in user's locale.

