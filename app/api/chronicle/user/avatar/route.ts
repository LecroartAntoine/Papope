import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { put } from '@vercel/blob'  

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('avatar') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    // Extract the original file extension safely
    const fileExtension = file.name.split('.').pop() || 'png'

    // Append a timestamp so that each upload is given a completely unique URL.
    // This breaks client-side and CDN edge caches instantly upon DB update.
    const uniquePathname = `avatars/${session.user?.name}-${Date.now()}.${fileExtension}`

    const blob = await put(uniquePathname, file, { access: 'public' })
    const avatarUrl = blob.url

    await sql`
      UPDATE users
      SET avatar_url = ${avatarUrl}
      WHERE username = ${session.user.name};
    ` 
    return NextResponse.json({ ok: true, avatar_url: avatarUrl })
  } catch (err) {
    console.error('[chronicle/user/avatar POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}