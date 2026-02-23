import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

// All tables that have a `date` column
const DATE_TABLES = [
  'sessions',
  'day_plans',
  'nutrition_logs',
  'wellbeing_logs',
  'lift_logs',
  'climb_logs',
  'chat_history',
  'body_metrics',
] as const

type DateTable = typeof DATE_TABLES[number]

async function auth() {
  const session = await getServerSession(authOptions)
  return !!session
}

// ─── GET /api/admin?action=stats ─────────────────────────────────────────────
// ─── GET /api/admin?action=export&from=&to= ──────────────────────────────────

export async function GET(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const action = req.nextUrl.searchParams.get('action')

  if (action === 'stats') {
    try {
      const counts = await Promise.all(
        DATE_TABLES.map(async (table) => {
          const { rows } = await sql.query(`SELECT COUNT(*) as count, MIN(date) as oldest, MAX(date) as newest FROM ${table}`)
          return {
            table,
            count: parseInt(rows[0].count),
            oldest: rows[0].oldest,
            newest: rows[0].newest,
          }
        })
      )
      return NextResponse.json(counts)
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  if (action === 'export') {
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')
    if (!from || !to) return NextResponse.json({ error: 'from et to requis' }, { status: 400 })

    try {
      const [sessions, dayPlans, nutrition, wellbeing, lifts, climbs, chat, metrics] = await Promise.all([
        sql.query(`SELECT * FROM sessions WHERE date BETWEEN $1 AND $2 ORDER BY date`, [from, to]),
        sql.query(`SELECT * FROM day_plans WHERE date BETWEEN $1 AND $2 ORDER BY date`, [from, to]),
        sql.query(`SELECT * FROM nutrition_logs WHERE date BETWEEN $1 AND $2 ORDER BY date`, [from, to]),
        sql.query(`SELECT * FROM wellbeing_logs WHERE date BETWEEN $1 AND $2 ORDER BY date`, [from, to]),
        sql.query(`SELECT * FROM lift_logs WHERE date BETWEEN $1 AND $2 ORDER BY date, created_at`, [from, to]),
        sql.query(`SELECT * FROM climb_logs WHERE date BETWEEN $1 AND $2 ORDER BY date, created_at`, [from, to]),
        sql.query(`SELECT * FROM chat_history WHERE date BETWEEN $1 AND $2 ORDER BY date, created_at`, [from, to]),
        sql.query(`SELECT * FROM body_metrics WHERE date BETWEEN $1 AND $2 ORDER BY date`, [from, to]),
      ])

      const exportData = {
        exported_at: new Date().toISOString(),
        range: { from, to },
        sessions: sessions.rows,
        day_plans: dayPlans.rows,
        nutrition_logs: nutrition.rows,
        wellbeing_logs: wellbeing.rows,
        lift_logs: lifts.rows,
        climb_logs: climbs.rows,
        chat_history: chat.rows,
        body_metrics: metrics.rows,
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="keep-pushing-export-${from}-${to}.json"`,
        },
      })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}

// ─── POST /api/admin ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await req.json()
    const { action, from, to, tables } = body

    if (action === 'delete_range') {
      if (!from || !to) return NextResponse.json({ error: 'from et to requis' }, { status: 400 })
      if (!Array.isArray(tables) || tables.length === 0) return NextResponse.json({ error: 'tables requis' }, { status: 400 })

      // Validate table names against whitelist
      const invalid = tables.filter((t: string) => !DATE_TABLES.includes(t as DateTable))
      if (invalid.length > 0) return NextResponse.json({ error: `Tables invalides: ${invalid.join(', ')}` }, { status: 400 })

      const results: Record<string, number> = {}

      for (const table of tables) {
        const { rowCount } = await sql.query(
          `DELETE FROM ${table} WHERE date BETWEEN $1 AND $2`,
          [from, to]
        )
        results[table] = rowCount ?? 0
      }

      return NextResponse.json({ ok: true, deleted: results })
    }

    if (action === 'run_migrations') {
      const { runMigrations } = await import('@/lib/db')
      await runMigrations()
      return NextResponse.json({ ok: true, message: 'Migrations exécutées avec succès' })
    }

    if (action === 'truncate_table') {
      const { table } = body
      if (!DATE_TABLES.includes(table as DateTable)) {
        return NextResponse.json({ error: 'Table invalide' }, { status: 400 })
      }
      const { rowCount } = await sql.query(`DELETE FROM ${table}`)
      return NextResponse.json({ ok: true, deleted: rowCount })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
