import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

// GET /api/lifts?days=60
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '60')
  const exerciseId = req.nextUrl.searchParams.get('exercise_id')

  try {
    if (exerciseId) {
      const { rows } = await sql`
        SELECT * FROM lift_logs
        WHERE date >= CURRENT_DATE - ${days}::int
          AND exercise_id = ${exerciseId}
        ORDER BY date ASC
      `
      return NextResponse.json(rows)
    }

    const { rows } = await sql`
      SELECT * FROM lift_logs
      WHERE date >= CURRENT_DATE - ${days}::int
      ORDER BY date ASC, exercise_id ASC
    `
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/lifts  — upsert one lift entry
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { date, exercise_id, exercise, sets, reps, weight_kg, notes } = await req.json()
    const { rows } = await sql`
      INSERT INTO lift_logs (date, exercise_id, exercise, sets, reps, weight_kg, notes)
      VALUES (${date}, ${exercise_id}, ${exercise}, ${sets ?? null}, ${reps ?? null}, ${weight_kg ?? null}, ${notes ?? null})
      ON CONFLICT (date, exercise_id) DO UPDATE SET
        sets = EXCLUDED.sets,
        reps = EXCLUDED.reps,
        weight_kg = EXCLUDED.weight_kg,
        notes = EXCLUDED.notes
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
