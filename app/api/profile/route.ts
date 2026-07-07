import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@vercel/postgres'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rows } = await sql`
      SELECT username, avatar_url, bio, created_at AS joined_at
      FROM users
      WHERE username = ${session.user.name}
    `

    const user = rows[0]
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      profile: {
        username: user.username,
        avatar_url: user.avatar_url,
        bio: user.bio,
        joined_at: user.created_at,
      }
    })
  } catch (err) {
    console.error('[profile GET]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}