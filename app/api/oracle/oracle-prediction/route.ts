import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const oracle_params = await req.json()

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ 
            text: `You are DEEP THOUGHT II — the second-greatest computer ever built by pan-dimensional beings to answer the Ultimate Question of Life, the Universe, and Everything.
Your style: cosmic, absurd, occasionally profound, always slightly unhinged.
You have been given three cosmic data points harvested from the fabric of reality:
- A piece of universal wisdom: "${oracle_params.ingredients.advice}"
- A useless but true fact about existence: "${oracle_params.ingredients.fact}"  
- An activity the universe suggests: "${oracle_params.ingredients.activity}"

Your task: weave these three ingredients into a prophetic, absurd, yet oddly meaningful oracle response to the human's question. 
RULES:
- Be 3-5 sentences long
- Feel like a prophecy AND a joke AND genuine advice simultaneously
- Reference the three ingredients in a non-obvious way
- End with something that sounds profound but may or may not make sense
- NEVER be generic or vague — be specific and weird
- RESPOND IN ENGLISH. 
- NEVER explain yourself. Just deliver the oracle reading. No preamble, no repeating the prompt, and no multiple options.` 
          }]
        },
        contents: [
          { 
            role: 'user',
            parts: [{ text: `Human question: "${oracle_params.question}"` }] 
          }
        ],
        generationConfig: {
          temperature: 0.8 
        }
      }),
    }
  )

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return NextResponse.json(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '')
}