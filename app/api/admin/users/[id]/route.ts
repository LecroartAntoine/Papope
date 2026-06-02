import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { authOptions } from '@/lib/authOptions'

export async function DELETE(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   const { id } = await params
   const session = await getServerSession(authOptions)

   if (!session?.user?.isAdmin) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
   }

   try {
     const userId = parseInt(id)

    // Prevent deleting self
    if (session.user.id === String(userId)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user (cascades to user_access)
    await sql`DELETE FROM users WHERE id = ${userId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
