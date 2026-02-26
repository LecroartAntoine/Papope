import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

// GET /api/day-plan/week?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const from = req.nextUrl.searchParams.get('from')
  const to   = req.nextUrl.searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from et to requis' }, { status: 400 })

  try {
    const { rows } = await sql`
      SELECT date, title, emoji, type, items
      FROM day_plans
      WHERE date >= ${from} AND date <= ${to}
      ORDER BY date ASC
    `
    // Return as map: { "2025-01-06": { title, emoji, type, items }, ... }
    const map: Record<string, any> = {}
    rows.forEach(r => {
      const dk = r.date instanceof Date ? r.date.toLocaleDateString('en-CA') : String(r.date).split('T')[0]; map[dk] = {
        title: r.title,
        emoji: r.emoji,
        type: r.type,
        items: r.items,
      }
    })
    return NextResponse.json(map)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/day-plan/week — bulk upsert multiple days at once
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { plans } = await req.json()
    // plans: Array<{ date, title, emoji, type, items }>
    if (!Array.isArray(plans)) return NextResponse.json({ error: 'plans must be array' }, { status: 400 })

    for (const plan of plans) {
      const { date, title, emoji, type, items } = plan
      if (!date) continue
      await sql`
        INSERT INTO day_plans (date, title, emoji, type, items, updated_at)
        VALUES (
          ${date},
          ${title ?? ''},
          ${emoji ?? '📅'},
          ${type ?? 'mixed'},
          ${JSON.stringify(items ?? [])}::jsonb,
          NOW()
        )
        ON CONFLICT (date) DO UPDATE SET
          title = EXCLUDED.title,
          emoji = EXCLUDED.emoji,
          type  = EXCLUDED.type,
          items = EXCLUDED.items,
          updated_at = NOW()
      `
    }
    return NextResponse.json({ ok: true, count: plans.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}