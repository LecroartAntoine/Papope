import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { authOptions } from '@/lib/authOptions'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const userId = req.nextUrl.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter required' },
      { status: 400 }
    )
  }

  try {
    const result = await sql`
      SELECT section FROM user_access WHERE user_id = ${parseInt(userId)}
    `
    const sections = result.rows.map((row: any) => row.section)
    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error fetching user access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { userId, sections } = body

    if (!userId || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'userId and sections array are required' },
        { status: 400 }
      )
    }

    // Delete existing access for this user
    await sql`DELETE FROM user_access WHERE user_id = ${userId}`

    // Insert new access entries
    for (const section of sections) {
      await sql`
        INSERT INTO user_access (user_id, section)
        VALUES (${userId}, ${section})
      `
    }

    return NextResponse.json({ success: true, sections })
  } catch (error) {
    console.error('Error updating user access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
