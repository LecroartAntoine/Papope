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
    const { rows } = await sql`SELECT * FROM day_plans WHERE date = ${params.date}`
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
    const { title, emoji, type, items } = await req.json()

    const { rows } = await sql`
      INSERT INTO day_plans (date, title, emoji, type, items, updated_at)
      VALUES (
        ${params.date},
        ${title ?? ''},
        ${emoji ?? '📅'},
        ${type ?? 'mixed'},
        ${JSON.stringify(items ?? [])}::jsonb,
        NOW()
      )
      ON CONFLICT (date) DO UPDATE SET
        title      = EXCLUDED.title,
        emoji      = EXCLUDED.emoji,
        type       = EXCLUDED.type,
        items      = EXCLUDED.items,
        updated_at = NOW()
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { date: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    await sql`DELETE FROM day_plans WHERE date = ${params.date}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
