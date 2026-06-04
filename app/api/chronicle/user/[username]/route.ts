// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/chronicle/user/[username]/route.ts
// GET /api/chronicle/user/[username] — public profile page
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const { username } = await params
  const decodedName = decodeURIComponent(username)
 
  try {
    // Fetch user meta
    const { rows: userRows } = await sql`
      SELECT username, avatar_url, bio, created_at AS joined_at
      FROM users
      WHERE username = ${decodedName}
    `
 
    // If no dedicated user row, build a minimal profile from review data
    const userMeta = userRows[0] ?? {
      name: decodedName,
      avatar_url: null,
      bio: null,
      joined_at: null,
    }
 
    // Fetch their traces with book info
    const { rows: traceRows } = await sql`
      SELECT
        r.id,
        r.book_id,
        b.title AS book_title,
        b.author AS book_author,
        b.image_url AS book_image_url,
        COALESCE(b.categories, ARRAY[b.category]) AS book_categories,
        r.date_read,
        r.rating,
        r.recommendation,
        r.created_at,
        r.language_read
      FROM chronicle_reviews r
      JOIN chronicle_books b ON b.id = r.book_id
      WHERE r.reviewer_name = ${decodedName}
      ORDER BY r.created_at DESC
    `
 
    // Fetch their favorites
    const { rows: favRows } = await sql`
      SELECT b.id, b.title, b.author, b.image_url,
             COALESCE(b.categories, ARRAY[b.category]) AS categories
      FROM chronicle_favorites f
      JOIN chronicle_books b ON b.id = f.book_id
      WHERE f.user_name = ${decodedName}
      ORDER BY f.created_at DESC
    `
 
    return NextResponse.json({
      profile: {
        ...userMeta,
        traces: traceRows,
        favorites: favRows,
      }
    })
  } catch (err) {
    console.error('[chronicle/user GET]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}