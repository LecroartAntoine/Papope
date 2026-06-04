// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/chronicle/favorites/route.ts
// GET + POST + DELETE /api/chronicle/favorites
// ════════════════════════════════════════════════════════════════════════════
 
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
 
// GET /api/chronicle/favorites — returns the current user's favorited book ids
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  try {
    const { rows } = await sql`
      SELECT book_id FROM chronicle_favorites WHERE user_name = ${session.user?.name}
    `
    return NextResponse.json({ favorites: rows.map(r => r.book_id) })
  } catch (err) {
    console.error('[chronicle/favorites GET]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
 
// POST /api/chronicle/favorites?bookId=123 — add to favorites
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const bookId = req.nextUrl.searchParams.get('bookId')
  if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 })
 
  try {
    await sql`
      INSERT INTO chronicle_favorites (book_id, user_name)
      VALUES (${parseInt(bookId)}, ${session.user?.name})
      ON CONFLICT DO NOTHING
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/favorites POST]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
 
// DELETE /api/chronicle/favorites?bookId=123 — remove from favorites
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const bookId = req.nextUrl.searchParams.get('bookId')
  if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 })
 
  try {
    await sql`
      DELETE FROM chronicle_favorites
      WHERE book_id = ${parseInt(bookId)} AND user_name = ${session.user?.name}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/favorites DELETE]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}