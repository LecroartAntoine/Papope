// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/chronicle/replies/route.ts
// POST + DELETE /api/chronicle/replies
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// POST — add reply to a trace
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  try {
    const { trace_id, author_name, content } = await req.json()
    if (!trace_id || !content?.trim()) {
      return NextResponse.json({ error: 'trace_id and content required' }, { status: 400 })
    }
 
    const { rows } = await sql`
      INSERT INTO chronicle_replies (trace_id, author_name, content)
      VALUES (${trace_id}, ${author_name ?? session.user?.name}, ${content.trim()})
      RETURNING id
    `
    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (err) {
    console.error('[chronicle/replies POST]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
 
// DELETE /api/chronicle/replies?id=123
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
 
  try {
    // Only delete if the session user is the author
    await sql`
      DELETE FROM chronicle_replies
      WHERE id = ${parseInt(id)} AND author_name = ${session.user?.name}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/replies DELETE]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
 