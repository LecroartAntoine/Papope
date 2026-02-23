import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17'

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 2048 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function parseJson(raw: string): any {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  return JSON.parse(match ? match[1] : raw.trim())
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Date manquante' }, { status: 400 })
  try {
    const { rows } = await sql`SELECT id, role, content, patch, created_at FROM chat_history WHERE date = ${date} ORDER BY created_at ASC`
    return NextResponse.json(rows)
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY manquant' }, { status: 500 })

  try {
    const { date, message, currentDayPlan, currentItems } = await req.json()
    await sql`INSERT INTO chat_history (date, role, content) VALUES (${date}, 'user', ${message})`

    const [sessionRow, wellbeing, nutrition, painHistory, chatRows] = await Promise.all([
      sql`SELECT * FROM sessions WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM wellbeing_logs WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM nutrition_logs WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT date, pain_level FROM sessions WHERE date >= CURRENT_DATE - 14 AND pain_level IS NOT NULL ORDER BY date ASC`.then(r => r.rows),
      sql`SELECT role, content FROM chat_history WHERE date = ${date} ORDER BY created_at ASC`.then(r => r.rows),
    ])

    const prompt = buildPrompt({ date, message, currentDayPlan, currentItems, sessionRow, wellbeing, nutrition, painHistory, conversationHistory: chatRows.slice(0, -1) })
    const rawText = await callGemini(prompt, apiKey)

    let coachMessage = rawText
    let patch: any = null
    let generatedDay: any = null

    try {
      const parsed = parseJson(rawText)
      coachMessage = parsed.message ?? rawText
      patch = parsed.patch ?? null
      generatedDay = parsed.generated_day ?? null
    } catch {
      coachMessage = rawText.replace(/```[\s\S]*?```/g, '').trim()
    }

    // Persist generated day directly to DB
    if (generatedDay) {
      await sql`
        INSERT INTO day_plans (date, title, emoji, type, items, updated_at)
        VALUES (${date}, ${generatedDay.title ?? 'Séance générée'}, ${generatedDay.emoji ?? '🤖'}, ${generatedDay.type ?? 'mixed'}, ${JSON.stringify(generatedDay.items ?? [])}::jsonb, NOW())
        ON CONFLICT (date) DO UPDATE SET title=EXCLUDED.title, emoji=EXCLUDED.emoji, type=EXCLUDED.type, items=EXCLUDED.items, updated_at=NOW()
      `.catch(() => {})
    }

    await sql`INSERT INTO chat_history (date, role, content, patch) VALUES (${date}, 'coach', ${coachMessage}, ${patch || generatedDay ? JSON.stringify(patch ?? { generated_day: true }) : null}::jsonb)`

    return NextResponse.json({ message: coachMessage, patch, generatedDay })
  } catch (err: any) {
    console.error('Coach error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function buildPrompt(ctx: any): string {
  const { date, message, currentDayPlan, currentItems, sessionRow, wellbeing, nutrition, painHistory, conversationHistory } = ctx

  const itemsList = (currentItems ?? []).map((item: any) => {
    if (item.type === 'exercise') return `  - id="${item.id}" type=exercise : ${item.name}${item.sets ? ` (${item.sets})` : ''}`
    if (item.type === 'climb')   return `  - id="${item.id}" type=climb : ${item.label ?? 'Escalade'}`
    if (item.type === 'hike')    return `  - id="${item.id}" type=hike : ${item.label ?? 'Rando'}${item.km ? ` ${item.km}km` : ''}${item.elevation_m ? ` D+${item.elevation_m}m` : ''}`
    if (item.type === 'cardio')  return `  - id="${item.id}" type=cardio : ${item.activity}${item.duration_min ? ` ${item.duration_min}min` : ''}`
    return `  - id="${item.id}" type=${item.type}`
  }).join('\n') || '  (aucun item planifié)'

  const wellbeingSummary = wellbeing
    ? `humeur=${wellbeing.humeur ?? '?'}/10, fatigue=${wellbeing.fatigue ?? '?'}/10, stress=${wellbeing.stress ?? '?'}/10, sommeil=${wellbeing.sommeil_h ?? '?'}h, alcool=${wellbeing.alcool_verres ?? '?'} verres, douleur=${wellbeing.douleur_generale ?? '?'}/10`
    : 'Non renseigné'

  const painAvg = painHistory.length
    ? (painHistory.reduce((s: number, r: any) => s + (r.pain_level ?? 0), 0) / painHistory.length).toFixed(1)
    : null

  const historyText = conversationHistory.map((m: any) => `${m.role === 'user' ? 'Utilisateur' : 'Coach'}: ${m.content}`).join('\n')

  return `Tu es un coach sportif IA dans l'app "Keep Pushing !". Tu adaptes et génères des séances en temps réel.

PROFIL : 84kg, 1,95m, grimpeur débutant, rétablissement tendineux bras (biceps/avant-bras).
Objectifs : progresser escalade, esthétique, éliminer douleurs.

RÈGLES ABSOLUES :
- Douleur bras ≥4/10 → supprimer exercices bras
- Jamais campus board ni entraînement max doigts
- Toujours échauffement si séance physique

JOURNÉE : ${date} — ${currentDayPlan?.title ?? 'Sans plan'}
Items actuels :
${itemsList}

Douleur bras : ${sessionRow?.pain_level ?? '?'}/10 · Moy 14j : ${painAvg ?? '?'}/10
Bien-être : ${wellbeingSummary}
Nutrition : ${nutrition ? `protéines=${nutrition.proteines_g ?? '?'}g` : 'Non renseigné'}

${historyText ? `HISTORIQUE :\n${historyText}\n` : ''}
MESSAGE : "${message}"

Réponds UNIQUEMENT avec du JSON valide (sans markdown autour) :

CAS 1 — Adapter la séance existante (fatigue, douleur, peu de temps) :
{"message":"...","patch":{"skip":["id-exact"],"modify":{"id-exact":{"sets":"2×6","note":"raison"}},"session_note":"<80 chars"},"generated_day":null}

CAS 2 — Créer/remplacer entièrement la journée (nouvelle séance, rando, cardio, repos…) :
{"message":"...","patch":null,"generated_day":{"title":"Nom","emoji":"💪","type":"exercise","items":[{"id":"gen-1","type":"exercise","name":"Rameur échauffement","sets":"5 min","checked":false},{"id":"gen-2","type":"exercise","name":"Squat bulgare","sets":"3×8","weight":"PC","notes":"RIR 2","checked":false}]}}

Types items : exercise{id,type,name,sets?,weight?,reps?,notes?,checked:false} | climb{id,type,label?,notes?,checked:false} | hike{id,type,label?,km?,elevation_m?,duration_min?,notes?,checked:false} | cardio{id,type,activity,duration_min?,distance_km?,notes?,checked:false} | event{id,type,label,notes?,checked:false} | rest{id,type,label?,checked:false}

Ids courts et uniques (gen-1, gen-2…). Pour force : toujours commencer par échauffement. Max 7 exercices. Pour la conversation simple : patch=null, generated_day=null.`
}
