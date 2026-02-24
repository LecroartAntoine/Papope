import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

// GET /api/supplement-logs?date=YYYY-MM-DD
// GET /api/supplement-logs?days=30  (for charts)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  const days = req.nextUrl.searchParams.get('days')

  try {
    if (date) {
      const { rows } = await sql`
        SELECT sl.supplement_id, sl.value, s.name, s.unit, s.emoji, s.color, s.target, s.hint, s.climb_only, s.sort_order
        FROM supplement_logs sl
        JOIN supplements s ON s.id = sl.supplement_id
        WHERE sl.date = ${date}
      `
      // Return as { supplement_id: value } map for easy lookup
      const map: Record<number, number | null> = {}
      rows.forEach(r => { map[r.supplement_id] = r.value })
      return NextResponse.json(map)
    }

    if (days) {
      const { rows } = await sql`
        SELECT sl.date, sl.supplement_id, sl.value, s.name, s.unit
        FROM supplement_logs sl
        JOIN supplements s ON s.id = sl.supplement_id
        WHERE sl.date >= CURRENT_DATE - ${parseInt(days)}::int
        ORDER BY sl.date ASC
      `
      return NextResponse.json(rows)
    }

    return NextResponse.json({ error: 'date ou days requis' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/supplement-logs — upsert one or many values for a date
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { date, entries } = await req.json()
    // entries: [{ supplement_id, value }]
    for (const { supplement_id, value } of entries) {
      if (value == null || isNaN(parseFloat(value))) {
        // Delete the log entry if value cleared
        await sql`
          DELETE FROM supplement_logs WHERE date = ${date} AND supplement_id = ${supplement_id}
        `
      } else {
        await sql`
          INSERT INTO supplement_logs (date, supplement_id, value, updated_at)
          VALUES (${date}, ${supplement_id}, ${parseFloat(value)}, NOW())
          ON CONFLICT (date, supplement_id) DO UPDATE
            SET value = EXCLUDED.value, updated_at = NOW()
        `
      }
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
