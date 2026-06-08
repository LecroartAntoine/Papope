import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// ─── GET /api/chronicle/books/[bookId] ───────────────────────────────────────

export async function GET(
   _req: NextRequest,
   { params }: { params: Promise<{ bookId: string }> }
) {
   const { bookId: bookIdStr } = await params
   const session = await getServerSession(authOptions)
   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

   const bookId = parseInt(bookIdStr)
  if (isNaN(bookId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

   try {
     // Fetch book
     const { rows: bookRows } = await sql`
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
       WHERE b.id = ${bookId}
       GROUP BY b.id
     `
     if (bookRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

     // Fetch reviews
     const { rows: reviewRows } = await sql`
       SELECT id, reviewer_name, date_read, pages, rating, recommendation, created_at, language_read, dimensions
       FROM chronicle_reviews
       WHERE book_id = ${bookId}
       ORDER BY created_at DESC
     `

     // Fetch reactions for all reviews in this book
     const reviewIds = reviewRows.map((r: any) => r.id)
     let reactionsMap: Record<number, any[]> = {}
     if (reviewIds.length > 0) {
       const { rows: reactionRows } = await sql`
         SELECT trace_id, user_name
         FROM chronicle_reactions
         WHERE trace_id = ANY(${reviewIds as any}::int[])
       `
       reactionsMap = reactionRows.reduce((acc: Record<number, any[]>, r: any) => {
         if (!acc[r.trace_id]) acc[r.trace_id] = []
         acc[r.trace_id].push(r)
         return acc
       }, {})
     }

     // Fetch replies for all reviews in this book
     let repliesMap: Record<number, any[]> = {}
     if (reviewIds.length > 0) {
       const { rows: replyRows } = await sql`
         SELECT id, trace_id, author_name, content, created_at
         FROM chronicle_replies
         WHERE trace_id = ANY(${reviewIds as any}::int[])
         ORDER BY created_at ASC
       `
       repliesMap = replyRows.reduce((acc: Record<number, any[]>, r: any) => {
         if (!acc[r.trace_id]) acc[r.trace_id] = []
         acc[r.trace_id].push({
           id: r.id,
           trace_id: r.trace_id,
           author_name: r.author_name,
           content: r.content,
           created_at: r.created_at,
         })
         return acc
       }, {})
     }

     // Attach reactions and replies to each review
     const enrichedReviews = reviewRows.map((r: any) => ({
       ...r,
       reactions: reactionsMap[r.id] || [],
       replies: repliesMap[r.id] || [],
     }))

     return NextResponse.json({
       book: {
         ...bookRows[0],
         reviews: enrichedReviews,
       }
     })
  } catch (err) {
    console.error('[chronicle/books/[bookId] GET]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// ─── PUT /api/chronicle/books/[bookId] ────────────────────────────────────────

export async function PUT(
   req: NextRequest,
   { params }: { params: Promise<{ bookId: string }> }
) {
   const { bookId: bookIdStr } = await params
   const session = await getServerSession(authOptions)
   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

   const bookId = parseInt(bookIdStr)
  if (isNaN(bookId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const { title, author, image_url, categories } = await req.json()

    if (!title?.trim() || !author?.trim()) {
      return NextResponse.json({ error: 'title and author are required' }, { status: 400 })
    }

    // Verify the book exists
    const { rows: existingBook } = await sql`SELECT id FROM chronicle_books WHERE id = ${bookId}`
    if (existingBook.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const catArray = Array.isArray(categories) && categories.length > 0 
      ? categories.filter((c: string) => c?.trim()).map((c: string) => c.trim())
      : ['Other']

    await sql`
      UPDATE chronicle_books
      SET 
        title = ${title.trim()},
        author = ${author.trim()},
        image_url = ${image_url?.trim() || null},
        categories = ${catArray as any}
      WHERE id = ${bookId}
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/books/[bookId] PUT]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// ─── DELETE /api/chronicle/books/[bookId] ────────────────────────────────────

export async function DELETE(
   _req: NextRequest,
   { params }: { params: Promise<{ bookId: string }> }
) {
   const { bookId: bookIdStr } = await params
   const session = await getServerSession(authOptions)
   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

   const bookId = parseInt(bookIdStr)
  if (isNaN(bookId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await sql`DELETE FROM chronicle_books WHERE id = ${bookId}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/books/[bookId] DELETE]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
