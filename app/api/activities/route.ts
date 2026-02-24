import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { rows } = await sql`SELECT * FROM activities ORDER BY category, name`
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, category, emoji, default_duration_min, is_climbing, is_outdoor, has_sets } = body

    if (!name || !category) return NextResponse.json({ error: 'name et category requis' }, { status: 400 })

    const valid = ['movement', 'strength', 'recovery', 'event']
    if (!valid.includes(category)) return NextResponse.json({ error: 'category invalide' }, { status: 400 })

    // Check for very similar names (case-insensitive)
    const { rows: existing } = await sql`
      SELECT name FROM activities WHERE LOWER(name) = LOWER(${name})
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: `L'activité "${existing[0].name}" existe déjà`, existing: existing[0] }, { status: 409 })
    }

    const { rows } = await sql`
      INSERT INTO activities (name, category, emoji, default_duration_min, is_climbing, is_outdoor, has_sets)
      VALUES (
        ${name},
        ${category},
        ${emoji ?? '🏃'},
        ${default_duration_min ?? null},
        ${is_climbing ?? false},
        ${is_outdoor ?? false},
        ${has_sets ?? false}
      )
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Cette activité existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  try {
    await sql`DELETE FROM activities WHERE id = ${parseInt(id)}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
