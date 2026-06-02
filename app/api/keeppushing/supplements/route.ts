import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { rows } = await sql`
      SELECT * FROM supplements ORDER BY sort_order ASC, id ASC
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
    const body = await req.json()
    const { action } = body

    // Create new supplement
    if (action === 'create') {
      const { name, unit, target, emoji, color, hint, sort_order, climb_only } = body
      const { rows } = await sql`
        INSERT INTO supplements (name, unit, target, emoji, color, hint, sort_order, climb_only)
        VALUES (
          ${name}, ${unit ?? 'g'}, ${target ?? null},
          ${emoji ?? '💊'}, ${color ?? '#C8F135'},
          ${hint ?? null}, ${sort_order ?? 99}, ${climb_only ?? false}
        )
        RETURNING *
      `
      return NextResponse.json(rows[0])
    }

    // Update existing
    if (action === 'update') {
      const { id, name, unit, target, emoji, color, hint, sort_order, is_enabled, climb_only } = body
      const { rows } = await sql`
        UPDATE supplements SET
          name       = COALESCE(${name ?? null}, name),
          unit       = COALESCE(${unit ?? null}, unit),
          target     = COALESCE(${target ?? null}::numeric, target),
          emoji      = COALESCE(${emoji ?? null}, emoji),
          color      = COALESCE(${color ?? null}, color),
          hint       = ${hint ?? null},
          sort_order = COALESCE(${sort_order ?? null}::int, sort_order),
          is_enabled = COALESCE(${is_enabled ?? null}::boolean, is_enabled),
          climb_only = COALESCE(${climb_only ?? null}::boolean, climb_only),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return NextResponse.json(rows[0])
    }

    // Delete
    if (action === 'delete') {
      const { id } = body
      await sql`DELETE FROM supplements WHERE id = ${id}`
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
