import { NextResponse } from 'next/server'
import { db } from '@/lib/ionickel/db'
import { odometerLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'

// GET /api/ionickel/odometer  →  { km, date }
export async function GET() {
  try {
    const [latest] = await db
      .select()
      .from(odometerLog)
      .orderBy(desc(odometerLog.km))
      .limit(1)

    return NextResponse.json(latest ?? { km: 0, date: null })
  } catch (error) {
    console.error('[ionickel] GET odometer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ionickel/odometer
// Body: { km, date }
export async function POST(req: Request) {
  try {
    const { km, date } = await req.json()

    if (!km || !date) {
      return NextResponse.json({ error: 'km and date are required' }, { status: 400 })
    }

    const [entry] = await db
      .insert(odometerLog)
      .values({ km, date })
      .returning()

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('[ionickel] POST odometer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}