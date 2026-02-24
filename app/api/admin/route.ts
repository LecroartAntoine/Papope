import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

const DATE_TABLES = ['sessions','day_plans','nutrition_logs','wellbeing_logs','lift_logs','climb_logs','chat_history','body_metrics','supplement_logs']
const ALL_TABLES  = [...DATE_TABLES, 'activities', 'app_settings', 'supplements', 'supplement_logs']

async function auth() {
  const session = await getServerSession(authOptions)
  return !!session
}

export async function GET(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const action = req.nextUrl.searchParams.get('action')

  if (action === 'stats') {
    try {
      const counts = await Promise.all(
        ALL_TABLES.map(async (table) => {
          try {
            const hasDate = DATE_TABLES.includes(table)
            const q = hasDate
              ? `SELECT COUNT(*) as count, MIN(date) as oldest, MAX(date) as newest FROM ${table}`
              : `SELECT COUNT(*) as count, NULL as oldest, NULL as newest FROM ${table}`
            const { rows } = await sql.query(q)
            return { table, count: parseInt(rows[0].count), oldest: rows[0].oldest, newest: rows[0].newest }
          } catch { return { table, count: 0, oldest: null, newest: null } }
        })
      )
      return NextResponse.json(counts)
    } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
  }

  if (action === 'export') {
    const from = req.nextUrl.searchParams.get('from')
    const to   = req.nextUrl.searchParams.get('to')
    if (!from || !to) return NextResponse.json({ error: 'from et to requis' }, { status: 400 })
    try {
      const results = await Promise.all(DATE_TABLES.map(t =>
        sql.query(`SELECT * FROM ${t} WHERE date BETWEEN $1 AND $2 ORDER BY date`, [from, to])
          .then(r => [t, r.rows] as [string, any[]])
          .catch(() => [t, []] as [string, any[]])
      ))
      const data: any = { exported_at: new Date().toISOString(), range: { from, to } }
      results.forEach(([t, rows]) => { data[t] = rows })
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="keep-pushing-${from}-${to}.json"`,
        },
      })
    } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  if (!await auth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  try {
    const body = await req.json()
    const { action, from, to, tables, table } = body

    if (action === 'delete_range') {
      if (!from || !to) return NextResponse.json({ error: 'from et to requis' }, { status: 400 })
      if (!Array.isArray(tables) || tables.length === 0) return NextResponse.json({ error: 'tables requis' }, { status: 400 })
      const invalid = tables.filter((t: string) => !DATE_TABLES.includes(t))
      if (invalid.length) return NextResponse.json({ error: `Tables invalides: ${invalid.join(', ')}` }, { status: 400 })
      const results: Record<string, number> = {}
      for (const t of tables) {
        const { rowCount } = await sql.query(`DELETE FROM ${t} WHERE date BETWEEN $1 AND $2`, [from, to])
        results[t] = rowCount ?? 0
      }
      return NextResponse.json({ ok: true, deleted: results })
    }

    if (action === 'run_migrations') {
      const { runMigrations, runSupplementMigrations } = await import('@/lib/db')
      await runMigrations()
      await runSupplementMigrations()
      return NextResponse.json({ ok: true })
    }

    if (action === 'truncate_table') {
      if (!ALL_TABLES.includes(table)) return NextResponse.json({ error: 'Table invalide' }, { status: 400 })
      const { rowCount } = await sql.query(`DELETE FROM ${table}`)
      return NextResponse.json({ ok: true, deleted: rowCount })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}
