import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Date manquante' }, { status: 400 })

  try {
    const { rows } = await sql`
      SELECT id, role, content, patch, created_at
      FROM chat_history
      WHERE date = ${date}
      ORDER BY created_at ASC
    `
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { date, message, dayPlan, currentExercises } = await req.json()

    // 1. Save user message
    await sql`
      INSERT INTO chat_history (date, role, content)
      VALUES (${date}, 'user', ${message})
    `

    // 2. Load full context for this date
    const [sessionRow, wellbeing, nutrition, lifts, climbs, chatHistory] = await Promise.all([
      sql`SELECT * FROM sessions WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM wellbeing_logs WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM nutrition_logs WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM lift_logs WHERE date = ${date} ORDER BY created_at ASC`.then(r => r.rows),
      sql`SELECT * FROM climb_logs WHERE date = ${date} ORDER BY created_at ASC`.then(r => r.rows),
      // Last 7 days pain for context
      sql`SELECT date, pain_level FROM sessions WHERE date >= CURRENT_DATE - 7 AND pain_level IS NOT NULL ORDER BY date ASC`.then(r => r.rows),
    ])

    // 3. Build the full prompt with context + chat history from DB
    const { rows: history } = await sql`
      SELECT role, content FROM chat_history
      WHERE date = ${date}
      ORDER BY created_at ASC
    `

    const prompt = buildCoachPrompt({
      date,
      message,
      dayPlan,
      currentExercises,
      sessionRow,
      wellbeing,
      nutrition,
      lifts,
      climbs,
      painHistory: chatHistory,
      conversationHistory: history,
    })

    // 4. Call Gemini
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY manquant')
      console.log(prompt)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1,
            maxOutputTokens: 10000,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      throw new Error(`Gemini error: ${err}`)
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // 5. Parse JSON response from Gemini
    let coachMessage = rawText
    let patch = null

    try {
      // Gemini should return JSON wrapped in ```json ... ```
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : rawText
      const parsed = JSON.parse(jsonStr)
      coachMessage = parsed.message ?? rawText
      patch = parsed.patch ?? null
    } catch {
      // If parsing fails, use raw text as message, no patch
      coachMessage = rawText.replace(/```json[\s\S]*?```/g, '').trim()
    }

    // 6. If patch exists, apply it to the session in DB
    if (patch && sessionRow) {
      const updatedExercises = { ...(sessionRow.exercises ?? {}) }

      // Mark exercises as skipped (false)
      if (Array.isArray(patch.skip)) {
        patch.skip.forEach((id: string) => {
          updatedExercises[`__skipped_${id}`] = true // marker
          // Don't check it — skip = excluded from session
        })
      }

      // Apply note to session
      const sessionNote = patch.session_note
        ? `[Coach IA] ${patch.session_note}`
        : sessionRow.notes

      await sql`
        UPDATE sessions
        SET notes = ${sessionNote}, updated_at = NOW()
        WHERE date = ${date}
      `
    }

    // 7. Save coach response with patch
    await sql`
      INSERT INTO chat_history (date, role, content, patch)
      VALUES (${date}, 'coach', ${coachMessage}, ${patch ? JSON.stringify(patch) : null}::jsonb)
    `

    return NextResponse.json({ message: coachMessage, patch })
  } catch (err) {
    console.error('Coach error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function buildCoachPrompt(ctx: any): string {
  const {
    date, message, dayPlan, currentExercises,
    sessionRow, wellbeing, nutrition, lifts, climbs,
    painHistory, conversationHistory,
  } = ctx

  const exerciseList = dayPlan?.sections
    ?.flatMap((s: any) => s.exercises)
    ?.map((e: any) => `  - id="${e.id}" : ${e.name}${e.sets ? ` (${e.sets})` : ''}`)
    ?.join('\n') ?? 'Aucun exercice'

  const checkedIds = Object.entries(currentExercises ?? {})
    .filter(([, v]) => v).map(([k]) => k)

  const wellbeingSummary = wellbeing
    ? `humeur=${wellbeing.humeur ?? '?'}/10, fatigue=${wellbeing.fatigue ?? '?'}/10, stress=${wellbeing.stress ?? '?'}/10, sommeil=${wellbeing.sommeil_h ?? '?'}h, alcool=${wellbeing.alcool_verres ?? '?'} verres, douleur_corps=${wellbeing.douleur_generale ?? '?'}/10`
    : 'Non renseigné'

  const nutritionSummary = nutrition
    ? `protéines=${nutrition.proteines_g ?? '?'}g, créatine=${nutrition.creatine_g ?? '?'}g, eau=${nutrition.eau_ml ?? '?'}ml`
    : 'Non renseigné'

  const painAvg = painHistory.length
    ? (painHistory.reduce((s: number, r: any) => s + (r.pain_level ?? 0), 0) / painHistory.length).toFixed(1)
    : null

  const historyText = conversationHistory.slice(0, -1) // exclude the user message we just added
    .map((m: any) => `${m.role === 'user' ? 'Utilisateur' : 'Coach'}: ${m.content}`)
    .join('\n')

  return `Tu es un coach sportif IA intégré dans l'app "Keep Pushing !". Tu adaptes les séances en temps réel selon les retours de l'utilisateur.

PROFIL : 84 kg, 1,95 m, grimpeur débutant. Rétablissement douleur tendineuse bras (biceps/avant-bras). Objectif : progresser en escalade, esthétique, éliminer les douleurs.

RÈGLES NON NÉGOCIABLES :
- Douleur bras ≥4/10 → supprimer exercices sollicitant les bras
- Fatigue extrême → alléger ou convertir en récupération
- Ne jamais proposer campus board ni entrainement max doigts
- Toujours garder l'échauffement

SÉANCE DU JOUR (${date}) : ${dayPlan?.title ?? 'Inconnue'}
Exercices disponibles (avec leur id exact) :
${exerciseList}

Exercices déjà cochés : ${checkedIds.length > 0 ? checkedIds.join(', ') : 'aucun'}
Douleur bras actuelle : ${sessionRow?.pain_level ?? 'non renseignée'}/10
Douleur bras moy. 7j : ${painAvg ? `${painAvg}/10` : 'pas de données'}

Bien-être du jour : ${wellbeingSummary}
Nutrition du jour : ${nutritionSummary}

${historyText ? `HISTORIQUE DE CONVERSATION :\n${historyText}\n` : ''}
NOUVEAU MESSAGE UTILISATEUR : "${message}"

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown autour, juste le JSON) :
{
  "message": "Ta réponse en français, bienveillante et directe. 2-4 phrases max. Explique ce que tu adaptes et pourquoi.",
  "patch": {
    "skip": ["id1", "id2"],
    "modify": {
      "id3": { "sets": "2", "reps": "6", "note": "Réduit - fatigue" }
    },
    "session_note": "Texte court résumant l'adaptation pour les notes de séance",
    "convert_to_recovery": false
  }
}

RÈGLES POUR LE PATCH :
- "skip" : liste des ids d'exercices à supprimer de la séance. Utilise les ids EXACTS de la liste.
- "modify" : exercices à alléger avec nouvelles valeurs. Les ids doivent être EXACTS.
- "session_note" : note courte (max 80 chars) résumant l'adaptation
- "convert_to_recovery" : true uniquement si la séance entière doit devenir récupération
- Si aucune adaptation n'est nécessaire (question normale, encouragement), patch peut être null
- Ne modifie QUE les exercices qui existent dans la liste ci-dessus
- Sois précis : si l'utilisateur dit "bras douloureux", skip les exercices de tirage/bras, garde gainage et jambes`
}
