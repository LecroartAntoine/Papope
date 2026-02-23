import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

// GET /api/climbs?days=90
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '90')
  const date = req.nextUrl.searchParams.get('date')

  try {
    if (date) {
      const { rows } = await sql`
        SELECT * FROM climb_logs WHERE date = ${date} ORDER BY created_at ASC
      `
      return NextResponse.json(rows)
    }

    const { rows } = await sql`
      SELECT * FROM climb_logs
      WHERE date >= CURRENT_DATE - ${days}::int
      ORDER BY date ASC, created_at ASC
    `
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/climbs
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { date, grade, style, completed, notes } = await req.json()
    const { rows } = await sql`
      INSERT INTO climb_logs (date, grade, style, completed, notes)
      VALUES (${date}, ${grade}, ${style ?? null}, ${completed ?? false}, ${notes ?? null})
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/climbs?id=123
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    await sql`DELETE FROM climb_logs WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
