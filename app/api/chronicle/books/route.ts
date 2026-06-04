import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// ─── GET /api/chronicle/books ─────────────────────────────────────────────────

export async function GET() {
   const session = await getServerSession(authOptions)
   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

   try {
     const { rows } = await sql`
       SELECT
         b.id,
         b.title,
         b.author,
         b.image_url,
         COALESCE(b.categories, ARRAY[b.category]) AS categories,
         b.added_by,
         b.added_at,
         COUNT(DISTINCT r.id)::int AS review_count,
         ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
         COALESCE(
           json_agg(DISTINCT r.reviewer_name) FILTER (WHERE r.reviewer_name IS NOT NULL),
           '[]'
         ) AS readers,
         COUNT(DISTINCT f.id)::int AS favorite_count,
         BOOL_OR(f.user_name = ${session.user?.name}) AS is_favorited_by_me,
         MAX(r.created_at) AS last_traced_at,
         COALESCE(
           json_agg(DISTINCT ccr.user_name) FILTER (WHERE ccr.user_name IS NOT NULL),
           '[]'
         ) AS currently_reading
       FROM chronicle_books b
       LEFT JOIN chronicle_reviews r ON r.book_id = b.id
       LEFT JOIN chronicle_favorites f ON f.book_id = b.id
       LEFT JOIN chronicle_currently_reading ccr ON ccr.book_id = b.id
       GROUP BY b.id
       ORDER BY b.added_at DESC
     `
     return NextResponse.json({ books: rows })
   } catch (err) {
     console.error('[chronicle/books GET]', err)
     return NextResponse.json({ error: 'Database error' }, { status: 500 })
   }
 }

// ─── POST /api/chronicle/books ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, author, image_url, categories, added_by } = await req.json()

    if (!title?.trim() || !author?.trim() || !added_by?.trim()) {
      return NextResponse.json({ error: 'title, author, and added_by are required' }, { status: 400 })
    }

    const catArray = Array.isArray(categories) && categories.length > 0 
      ? categories.filter((c: string) => c?.trim()).map((c: string) => c.trim())
      : ['Other']

    const { rows } = await sql`
      INSERT INTO chronicle_books (title, author, image_url, categories, added_by)
      VALUES (
        ${title.trim()},
        ${author.trim()},
        ${image_url?.trim() || null},
        ${catArray  as any},
        ${added_by.trim()}
      )
      RETURNING id
    `

    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (err) {
    console.error('[chronicle/books POST]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
