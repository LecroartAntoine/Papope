import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// ─── POST /api/chronicle/reviews ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const {
      book_id,
      reviewer_name,
      date_read,
      rating,
      recommendation,
    } = await req.json()

    if (!book_id || !reviewer_name?.trim()) {
      return NextResponse.json({ error: 'book_id and reviewer_name are required' }, { status: 400 })
    }

    if (rating !== null && rating !== undefined && (rating < 0 || rating > 5)) {
      return NextResponse.json({ error: 'rating must be between 0.0 and 5.0' }, { status: 400 })
    }

    // Convert YYYY-MM format to YYYY-MM-01 (first day of month)
    let formattedDate = null
    if (date_read) {
      if (date_read.length === 7) { // YYYY-MM format
        formattedDate = `${date_read}-01` // Convert to first day of month
      } else {
        formattedDate = date_read
      }
    }

    const { rows } = await sql`
      INSERT INTO chronicle_reviews (book_id, reviewer_name, date_read, rating, recommendation)
      VALUES (
        ${book_id},
        ${reviewer_name.trim()},
        ${formattedDate},
        ${rating || null},
        ${recommendation?.trim() || ''}
      )
      RETURNING id
    `

    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (err) {
    console.error('[chronicle/reviews POST]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// ─── DELETE /api/chronicle/reviews ───────────────────────────────────────────
// DELETE /api/chronicle/reviews?id=123

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    await sql`DELETE FROM chronicle_reviews WHERE id = ${parseInt(id)}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/reviews DELETE]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
