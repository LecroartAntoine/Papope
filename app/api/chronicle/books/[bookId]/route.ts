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
      SELECT id, title, author, image_url, COALESCE(categories, ARRAY[category]) AS categories, added_by, added_at
      FROM chronicle_books
      WHERE id = ${bookId}
    `
    if (bookRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Fetch reviews
    const { rows: reviewRows } = await sql`
      SELECT id, reviewer_name, date_read, pages, rating, recommendation, created_at
      FROM chronicle_reviews
      WHERE book_id = ${bookId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      book: {
        ...bookRows[0],
        reviews: reviewRows,
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
