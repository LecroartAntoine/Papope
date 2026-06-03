import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { buildLibraryContext } from '@/lib/chronicle/librarian-context'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const currentUser = session.user?.name ?? 'Unknown reader'

  try {
    const { messages, language } = await req.json()

    const libraryData = await buildLibraryContext()

    const isEnglish = language === 'en'
    
    // UPDATED PROMPTS: Focus on conciseness and external real-world recommendations
    const systemPrompt = isEnglish
      ? `You are The Librarian, a warm and knowledgeable assistant for a private reading club.
The user currently talking to you is: ${currentUser}.

You have access to the club's reading database. Use it to understand members' tastes and past reads.
However, WHEN GIVING RECOMMENDATIONS, DO NOT restrict yourself to the database. Use your web search tool and general knowledge to recommend REAL books from the outside world that match the user's taste.

Rules for responding:
1. Be concise and direct. Do not write long, descriptive summaries of their past reads.
2. When asked for recommendations, use a short intro like "Based on your reading, here is what you could read next:" followed by 1-3 real book recommendations.
3. Include the Title, Author, and a maximum 1-sentence explanation of why it fits their taste.
4. Always refer to members by their first name.
5. Always respond in English.

--- LIBRARY DATABASE (JSON) ---
${libraryData}
--- END OF DATABASE ---`
      : `Tu es Le Bibliothécaire, un assistant chaleureux pour un club de lecture privé.
L'utilisateur qui te parle s'appelle: ${currentUser}.

Tu as accès à la base de données du club. Utilise-la pour comprendre les goûts et l'historique des membres.
Cependant, POUR LES RECOMMANDATIONS, NE TE LIMITE PAS à la base de données. Utilise ton outil de recherche web et tes connaissances pour recommander de VRAIS livres du monde extérieur qui correspondent aux goûts de l'utilisateur.

Règles pour répondre:
1. Sois concis et direct. Ne fais pas de longs résumés descriptifs de leurs lectures passées.
2. Lors d'une recommandation, utilise une courte introduction comme "D'après tes lectures, voici ce que tu pourrais lire ensuite :" suivie de 1 à 3 vraies recommandations de livres.
3. Inclus le Titre, l'Auteur, et une phrase maximum d'explication sur la raison pour laquelle cela correspond à leurs goûts.
4. Appelle toujours les membres par leur prénom.
5. Réponds toujours en français.

--- BASE DE DONNÉES DE LA BIBLIOTHÈQUE (JSON) ---
${libraryData}
--- FIN DE LA BASE DE DONNÉES ---`

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages,
      generationConfig: { temperature: 0.7 },
      tools: [
        {
          // FIXED: The correct property name in the Gemini API is `googleSearch`, not `google_search`
          googleSearch: {},
        },
      ],
    }

    const body = JSON.stringify(requestBody)

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }
    )

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text()
      console.error('[librarian] Gemini error:', errorText)
      return new Response(`Gemini error: ${geminiRes.status}`, { status: 502 })
    }

    // Pipe the SSE stream from Gemini → client as plain text tokens
    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const json = line.slice(6).trim()
            if (!json || json === '[DONE]') continue

            try {
              const parsed = JSON.parse(json)
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                controller.enqueue(new TextEncoder().encode(text))
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }

        if (buffer && buffer.startsWith('data: ')) {
          const json = buffer.slice(6).trim()
          if (json && json !== '[DONE]') {
            try {
              const parsed = JSON.parse(json)
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                controller.enqueue(new TextEncoder().encode(text))
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('[librarian] Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}