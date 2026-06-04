// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/chronicle/books/cover/route.ts
// POST /api/chronicle/books/cover — upload book cover image to Vercel Blob
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('cover') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    // Upload to Vercel Blob under book-covers/
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const blob = await put(`book-covers/${filename}`, file, { access: 'public', allowOverwrite: true })
    
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[chronicle/books/cover POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
