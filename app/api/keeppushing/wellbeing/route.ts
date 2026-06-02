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
      const { rows } = await sql`SELECT * FROM wellbeing_logs WHERE date = ${date}`
      return NextResponse.json(rows[0] ?? null)
    }
    const { rows } = await sql`
      SELECT * FROM wellbeing_logs
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
    const { date, humeur, fatigue, stress, sommeil_h, alcool_verres, douleur_generale, notes_perso } = await req.json()
    const { rows } = await sql`
      INSERT INTO wellbeing_logs (date, humeur, fatigue, stress, sommeil_h, alcool_verres, douleur_generale, notes_perso, updated_at)
      VALUES (
        ${date},
        ${humeur ?? null},
        ${fatigue ?? null},
        ${stress ?? null},
        ${sommeil_h ?? null},
        ${alcool_verres ?? null},
        ${douleur_generale ?? null},
        ${notes_perso ?? null},
        NOW()
      )
      ON CONFLICT (date) DO UPDATE SET
        humeur           = EXCLUDED.humeur,
        fatigue          = EXCLUDED.fatigue,
        stress           = EXCLUDED.stress,
        sommeil_h        = EXCLUDED.sommeil_h,
        alcool_verres    = EXCLUDED.alcool_verres,
        douleur_generale = EXCLUDED.douleur_generale,
        notes_perso      = EXCLUDED.notes_perso,
        updated_at       = NOW()
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
