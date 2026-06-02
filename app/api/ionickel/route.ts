import { NextResponse } from 'next/server'
import { db } from '@/lib/ionickel/db'
import { serviceLog } from '@/lib/ionickel/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const entries = await db
      .select()
      .from(serviceLog)
      .orderBy(desc(serviceLog.km))
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching service logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { km, date, items, notes } = body

    if (!km || !date || !items?.length) {
      return NextResponse.json({ error: 'km, date and items are required' }, { status: 400 })
    }

    const [entry] = await db
      .insert(serviceLog)
      .values({ km, date, items, notes })
      .returning()

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating service log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
