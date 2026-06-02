import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')

  try {
    if (type === 'advice') {
      const r = await fetch('https://api.adviceslip.com/advice', { cache: 'no-store' })
      const d = await r.json()
      return NextResponse.json({ value: d.slip?.advice ?? 'existence precedes essence' })
    }

    if (type === 'fact') {
      const r = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
      const d = await r.json()
      return NextResponse.json({ value: d.text ?? 'the universe is mostly empty space' })
    }

    if (type === 'bored') {
      const r = await fetch('https://bored-api.appbrewery.com/random')
      const d = await r.json()
      return NextResponse.json({ value: d.activity ?? 'contemplate the void' })
    }

    return NextResponse.json({ error: 'unknown type' }, { status: 400 })
  } catch {
    const fallbacks: Record<string, string> = {
      advice: 'existence precedes essence',
      fact: 'the universe is mostly empty space',
      bored: 'contemplate the void',
    }
    return NextResponse.json({ value: fallbacks[type ?? ''] ?? 'unknown' })
  }
}
