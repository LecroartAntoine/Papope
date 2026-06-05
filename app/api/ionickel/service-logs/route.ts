import { NextResponse } from 'next/server'
import { db } from '@/lib/ionickel/db'
import { serviceLog } from '@/lib/ionickel/schema'
import { odometerLog } from '@/lib/ionickel/schema'
import { desc, sql } from 'drizzle-orm'

// GET /api/ionickel/service-logs
export async function GET() {
  try {
    const entries = await db
      .select()
      .from(serviceLog)
      .orderBy(desc(serviceLog.km))
    return NextResponse.json(entries)
  } catch (error) {
    console.error('[ionickel] GET service-logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ionickel/service-logs
// Body: { km, date, items, cost?, shop?, notes?, syncGcal? }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { km, date, items, cost, shop, notes } = body

    if (!km || !date || !items?.length) {
      return NextResponse.json(
        { error: 'km, date and items are required' },
        { status: 400 }
      )
    }

    const [entry] = await db
      .insert(serviceLog)
      .values({ km, date, items, cost: cost ?? null, shop: shop ?? null, notes: notes ?? null })
      .returning()

    // Update odometer if this km is higher than current max
    await db
      .insert(odometerLog)
      .values({ km, date })
      .onConflictDoNothing()

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('[ionickel] POST service-logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}