// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/chronicle/user/bio/route.ts
// PUT /api/chronicle/user/bio — update current user's bio
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  try {
    const { bio } = await req.json()

    await sql`
      UPDATE users
      SET bio = ${bio?.trim() ?? ''}
      WHERE username = ${session.user.name};
    ` 
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[chronicle/user/bio PUT]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}