// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/chronicle/reactions/route.ts
// POST + DELETE /api/chronicle/reactions?traceId=N  (thumbs-up toggle)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const traceId = req.nextUrl.searchParams.get('traceId')
  if (!traceId) return NextResponse.json({ error: 'traceId required' }, { status: 400 })
 
  try {
    await sql`
      INSERT INTO chronicle_reactions (trace_id, user_name)
      VALUES (${parseInt(traceId)}, ${session.user?.name})
      ON CONFLICT DO NOTHING
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/reactions POST]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
 
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const traceId = req.nextUrl.searchParams.get('traceId')
  if (!traceId) return NextResponse.json({ error: 'traceId required' }, { status: 400 })
 
  try {
    await sql`
      DELETE FROM chronicle_reactions
      WHERE trace_id = ${parseInt(traceId)} AND user_name = ${session.user?.name}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/reactions DELETE]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}