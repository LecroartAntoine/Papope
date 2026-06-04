// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/chronicle/currently-reading/route.ts
// POST + DELETE /api/chronicle/currently-reading?bookId=N
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// POST — mark as currently reading
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const bookId = req.nextUrl.searchParams.get('bookId')
  if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 })
 
  try {
    await sql`
      INSERT INTO chronicle_currently_reading (book_id, user_name)
      VALUES (${parseInt(bookId)}, ${session.user?.name})
      ON CONFLICT DO NOTHING
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/currently-reading POST]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
 
// DELETE — unmark currently reading (also triggered automatically when a trace is added, handle in reviews POST)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const bookId = req.nextUrl.searchParams.get('bookId')
  if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 })
 
  try {
    await sql`
      DELETE FROM chronicle_currently_reading
      WHERE book_id = ${parseInt(bookId)} AND user_name = ${session.user?.name}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/currently-reading DELETE]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}