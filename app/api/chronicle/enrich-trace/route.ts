import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { recommendation } = await req.json()

    if (!recommendation?.trim()) {
      return NextResponse.json({ error: 'recommendation is required' }, { status: 400 })
    }

    const enrichmentPrompt = `
      Rewrite this book review to be more eloquent, polished, and engaging. Keep the same sentiment and message but improve clarity and style. ONLY RETURN THE REVIEW, NO THINKING TEXT OR ANALYSIS OR OPTIONS

      Original: "${recommendation}"`

    const requestBody = {
      // 1. Put the strict rules in the system instructions
      systemInstruction: {
        parts: [{ 
          text: "You are an expert editor. Rewrite the provided text to be more polished, and engaging. Keep the same sentiment and message but improve clarity and style. RETURN ONLY THE REWRITTEN TEXT. Do not include any preamble, analysis, thinking text, or alternative options. Try to respect the original style." 
        }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Original text to rewrite:\n"${recommendation}"` }],
        },
      ],
      generationConfig: { 
        temperature: 0.3 
      },
    }

    const body = JSON.stringify(requestBody)

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }
    )

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text()
      console.error('[enrich-trace] Gemini error:', errorText)
      return NextResponse.json(`Gemini error: ${geminiRes.status}`, { status: 502 })
    }

    const result = await geminiRes.json()

    let enrichedText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!enrichedText) {
      return NextResponse.json({ error: 'Failed to enrich trace' }, { status: 500 })
    }

    return NextResponse.json({ enrichedRecommendation: enrichedText })
  } catch (error) {
    console.error('[enrich-trace] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
