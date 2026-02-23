import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { date: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { rows } = await sql`SELECT * FROM sessions WHERE date = ${params.date}`
    return NextResponse.json(rows[0] ?? null)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await req.json()
    const { exercises, skipped, modifications, notes, pain_level } = body

    const { rows } = await sql`
      INSERT INTO sessions (date, exercises, skipped, modifications, notes, pain_level, updated_at)
      VALUES (
        ${params.date},
        ${JSON.stringify(exercises ?? {})}::jsonb,
        ${JSON.stringify(skipped ?? {})}::jsonb,
        ${JSON.stringify(modifications ?? {})}::jsonb,
        ${notes ?? ''},
        ${pain_level ?? null},
        NOW()
      )
      ON CONFLICT (date) DO UPDATE SET
        exercises     = EXCLUDED.exercises,
        skipped       = EXCLUDED.skipped,
        modifications = EXCLUDED.modifications,
        notes         = EXCLUDED.notes,
        pain_level    = EXCLUDED.pain_level,
        updated_at    = NOW()
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
