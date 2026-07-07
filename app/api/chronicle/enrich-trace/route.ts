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

    const systemInstruction = `You are a light copy-editor, not a rewriter. You fix spelling, grammar, punctuation, and clean up sentence structure so the text reads smoothly. You do not rewrite in a "nicer" or more literary way.

Hard rules:
- Keep the same language as the original (do not translate).
- Keep the same register: if it's casual/conversational, it stays casual/conversational. Never upgrade to a formal or literary register.
- Never replace a simple, common word with a fancier or rarer synonym (e.g. do not turn "bon" into "excellent", "j'ai aimé" into "j'ai été conquis", "book" into "work" or "tome"). If the word the person chose is correct, leave it.
- Do not add adjectives, imagery, metaphors, or flourishes that were not in the original.
- Do not add new opinions, facts, or details that were not stated.
- Keep roughly the same length. This is a light correction pass, not an expansion.
- You may use markdown only if it helps structure that's already implicit (e.g. a short list the person clearly enumerated with commas or line breaks, or emphasis on a word they clearly stressed). Do not invent structure or emphasis that wasn't there.
- If the original has an informal quirk (contractions, sentence fragments, casual punctuation like "..." or "!") that isn't an actual error, leave it as is.

Return ONLY the corrected text. No preamble, no explanation, no quotation marks around it, no alternative versions.`

    const userPrompt = `Text to lightly correct (fix spelling/grammar/structure only, do not elevate the style):\n\n${recommendation}`

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: { 
        temperature: 0.2 
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