import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

// GET /api/metrics?days=90
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '90')

  try {
    const { rows } = await sql`
      SELECT date, weight_kg
      FROM body_metrics
      WHERE date >= CURRENT_DATE - ${days}::int
      ORDER BY date ASC
    `
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/metrics  { date, weight_kg }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { date, weight_kg } = await req.json()
    const { rows } = await sql`
      INSERT INTO body_metrics (date, weight_kg)
      VALUES (${date}, ${weight_kg})
      ON CONFLICT (date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
