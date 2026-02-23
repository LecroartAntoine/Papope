import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '0')

  try {
    if (date) {
      const { rows } = await sql`SELECT * FROM nutrition_logs WHERE date = ${date}`
      return NextResponse.json(rows[0] ?? null)
    }
    const { rows } = await sql`
      SELECT * FROM nutrition_logs
      WHERE date >= CURRENT_DATE - ${days}::int
      ORDER BY date ASC
    `
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { date, proteines_g, collagene_g, creatine_g, eau_ml, notes } = await req.json()
    const { rows } = await sql`
      INSERT INTO nutrition_logs (date, proteines_g, collagene_g, creatine_g, eau_ml, notes, updated_at)
      VALUES (${date}, ${proteines_g ?? null}, ${collagene_g ?? null}, ${creatine_g ?? null}, ${eau_ml ?? null}, ${notes ?? null}, NOW())
      ON CONFLICT (date) DO UPDATE SET
        proteines_g = EXCLUDED.proteines_g,
        collagene_g = EXCLUDED.collagene_g,
        creatine_g  = EXCLUDED.creatine_g,
        eau_ml      = EXCLUDED.eau_ml,
        notes       = EXCLUDED.notes,
        updated_at  = NOW()
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
