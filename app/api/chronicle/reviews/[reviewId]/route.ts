import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// ─── GET /api/chronicle/reviews/[reviewId] ──────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  try {
    const { reviewId: reviewIdStr } = await params
    const reviewId = parseInt(reviewIdStr)
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 })
    }

    const { rows } = await sql`
      SELECT * FROM chronicle_reviews WHERE id = ${reviewId}
    `

    if (!rows.length) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ review: rows[0] })
  } catch (err) {
    console.error('[chronicle/reviews GET]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// ─── PUT /api/chronicle/reviews/[reviewId] ──────────────────────────────────

export async function PUT(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { reviewId: reviewIdStr } = await params
    const reviewId = parseInt(reviewIdStr)
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 })
    }

    const {
      date_read,
      rating,
      recommendation,
    } = await req.json()

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

    // Get the review to check ownership
    const { rows: reviewRows } = await sql`
      SELECT reviewer_name FROM chronicle_reviews WHERE id = ${reviewId}
    `

    if (!reviewRows.length) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if user owns this review
    if (reviewRows[0].reviewer_name !== session.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the review
    await sql`
      UPDATE chronicle_reviews
      SET 
        date_read = ${formattedDate},
        rating = ${rating || null},
        recommendation = ${recommendation?.trim() || ''}
      WHERE id = ${reviewId}
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/reviews PUT]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// ─── DELETE /api/chronicle/reviews/[reviewId] ───────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { reviewId: reviewIdStr } = await params
    const reviewId = parseInt(reviewIdStr)
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 })
    }

    // Get the review to check ownership
    const { rows: reviewRows } = await sql`
      SELECT reviewer_name FROM chronicle_reviews WHERE id = ${reviewId}
    `

    if (!reviewRows.length) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if user owns this review
    if (reviewRows[0].reviewer_name !== session.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the review
    await sql`DELETE FROM chronicle_reviews WHERE id = ${reviewId}`

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/reviews DELETE]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
