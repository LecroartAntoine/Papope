import { NextResponse } from 'next/server'
import { db } from '@/lib/ionickel/db'
import { tripLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'

// GET /api/ionickel/trips
export async function GET() {
  try {
    const entries = await db
      .select()
      .from(tripLog)
      .orderBy(desc(tripLog.date))
    return NextResponse.json(entries)
  } catch (error) {
    console.error('[ionickel] GET trips:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ionickel/trips
// Body: { date, distanceKm, mode, fuelLitres?, energyKwh?, destination? }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, distanceKm, mode, fuelLitres, energyKwh, destination } = body

    if (!date || !distanceKm || !mode) {
      return NextResponse.json(
        { error: 'date, distanceKm and mode are required' },
        { status: 400 }
      )
    }

    const [entry] = await db
      .insert(tripLog)
      .values({
        date,
        distanceKm,
        mode,
        fuelLitres: fuelLitres ?? 0,
        energyKwh:  energyKwh  ?? 0,
        destination: destination ?? null,
      })
      .returning()

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('[ionickel] POST trips:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}