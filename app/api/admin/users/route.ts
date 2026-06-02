import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/authOptions'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const result = await sql`
      SELECT id, username, is_admin, created_at FROM users ORDER BY created_at DESC
    `
    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Error fetching users:', error)
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
    const { username, password, isAdmin } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const result = await sql`
      INSERT INTO users (username, password_hash, is_admin)
      VALUES (${username}, ${hashedPassword}, ${isAdmin || false})
      RETURNING id, username, is_admin, created_at
    `

    return NextResponse.json({ user: result.rows[0] })
  } catch (error: any) {
    console.error('Error creating user:', error)
    if (error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
