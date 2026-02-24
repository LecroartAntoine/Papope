import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

const DEFAULT_MODEL = 'gemini-2.5-flash'

async function getModel(): Promise<string> {
  try {
    const { rows } = await sql`SELECT value FROM app_settings WHERE key = 'gemini_model'`
    return rows[0]?.value ?? DEFAULT_MODEL
  } catch { return DEFAULT_MODEL }
}

async function callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1, maxOutputTokens: 4096 },
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
    const { rows } = await sql`
      SELECT id, role, content, patch, created_at FROM chat_history
      WHERE date = ${date} ORDER BY created_at ASC
    `
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

    const [sessionRow, wellbeing, nutrition, painHistory, chatRows, activities] = await Promise.all([
      sql`SELECT * FROM sessions WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM wellbeing_logs WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM nutrition_logs WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT date, pain_level FROM sessions WHERE date >= CURRENT_DATE - 14 AND pain_level IS NOT NULL ORDER BY date ASC`.then(r => r.rows),
      sql`SELECT role, content FROM chat_history WHERE date = ${date} ORDER BY created_at ASC`.then(r => r.rows),
      // Load canonical activities so AI can reuse exact names
      sql`SELECT name, category, emoji FROM activities ORDER BY category, name`.then(r => r.rows).catch(() => []),
    ])

    const model = await getModel()
    const prompt = buildPrompt({
      date, message, currentDayPlan, currentItems,
      sessionRow, wellbeing, nutrition, painHistory,
      conversationHistory: chatRows.slice(0, -1),
      canonicalActivities: activities,
    })
    const rawText = await callGemini(prompt, apiKey, model)

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

    // If AI created new activities in generated_day, register them canonically
    if (generatedDay?.items) {
      for (const item of generatedDay.items) {
        if (!item.activity) continue
        await sql`
          INSERT INTO activities (name, category, emoji)
          VALUES (${item.activity}, ${item.category ?? 'movement'}, ${item.emoji ?? '🏃'})
          ON CONFLICT (name) DO NOTHING
        `.catch(() => {})
      }
    }

    // Persist generated day
    if (generatedDay) {
      await sql`
        INSERT INTO day_plans (date, title, emoji, type, items, updated_at)
        VALUES (
          ${date},
          ${generatedDay.title ?? 'Séance générée'},
          ${generatedDay.emoji ?? '🤖'},
          ${generatedDay.category ?? generatedDay.type ?? 'mixed'},
          ${JSON.stringify(generatedDay.items ?? [])}::jsonb,
          NOW()
        )
        ON CONFLICT (date) DO UPDATE SET
          title = EXCLUDED.title, emoji = EXCLUDED.emoji,
          type = EXCLUDED.type, items = EXCLUDED.items, updated_at = NOW()
      `.catch(() => {})
    }

    await sql`
      INSERT INTO chat_history (date, role, content, patch)
      VALUES (${date}, 'coach', ${coachMessage},
        ${patch || generatedDay ? JSON.stringify(patch ?? { generated_day: true }) : null}::jsonb)
    `

    return NextResponse.json({ message: coachMessage, patch, generatedDay })
  } catch (err: any) {
    console.error('Coach error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function buildPrompt(ctx: any): string {
  const {
    date, message, currentDayPlan, currentItems,
    sessionRow, wellbeing, nutrition, painHistory,
    conversationHistory, canonicalActivities,
  } = ctx

  // Format current items using the new flat structure
  const itemsList = (currentItems ?? []).map((item: any) => {
    const label = item.label || item.activity || item.name || '?'
    const details = [
      item.sets && `sets=${item.sets}`,
      item.weight && `poids=${item.weight}`,
      item.duration_min && `durée=${item.duration_min}min`,
      item.km && `${item.km}km`,
      item.elevation_m && `D+${item.elevation_m}m`,
    ].filter(Boolean).join(', ')
    return `  - id="${item.id}" cat=${item.category ?? 'unknown'} : ${label}${details ? ` (${details})` : ''}`
  }).join('\n') || '  (aucun item planifié)'

  // Canonical activity list for deduplication
  const activityList = (canonicalActivities ?? [])
    .map((a: any) => `  [${a.category}] ${a.emoji} ${a.name}`)
    .join('\n') || '  (catalogue vide)'

  const wellbeingSummary = wellbeing
    ? `humeur=${wellbeing.humeur ?? '?'}/10, fatigue=${wellbeing.fatigue ?? '?'}/10, stress=${wellbeing.stress ?? '?'}/10, sommeil=${wellbeing.sommeil_h ?? '?'}h, alcool=${wellbeing.alcool_verres ?? '?'} verres, douleur=${wellbeing.douleur_generale ?? '?'}/10`
    : 'Non renseigné'

  const painAvg = painHistory.length
    ? (painHistory.reduce((s: number, r: any) => s + (r.pain_level ?? 0), 0) / painHistory.length).toFixed(1)
    : null

  const historyText = conversationHistory
    .map((m: any) => `${m.role === 'user' ? 'Utilisateur' : 'Coach'}: ${m.content}`)
    .join('\n')

  return `Tu es un coach sportif IA dans l'app "Keep Pushing !". Tu adaptes et génères des séances.

PROFIL : 84kg, 1,95m, grimpeur débutant, rétablissement tendineux bras (biceps/avant-bras).
Activités régulières : Escalade (2×/sem), Beat Saber (jeu VR très physique, 2×/sem), Force, Randonnée.
Objectifs : progresser escalade, esthétique, éliminer douleurs.

RÈGLES ABSOLUES :
- Douleur bras ≥4/10 → supprimer exercices bras
- Jamais campus board ni entraînement max doigts
- Toujours échauffement si séance physique

CATALOGUE D'ACTIVITÉS CANONIQUES (utilise ces noms EXACTS pour éviter les doublons) :
${activityList}
Si tu veux utiliser une activité hors catalogue, crée-la avec un nom précis, correct en français, casse titre.

JOURNÉE : ${date} — ${currentDayPlan?.title ?? 'Sans plan'}
Items actuels :
${itemsList}

Douleur bras : ${sessionRow?.pain_level ?? '?'}/10 · Moy 14j : ${painAvg ?? '?'}/10
Bien-être : ${wellbeingSummary}
Nutrition : ${nutrition ? `protéines=${nutrition.proteines_g ?? '?'}g` : 'Non renseigné'}

${historyText ? `HISTORIQUE :\n${historyText}\n` : ''}
MESSAGE : "${message}"

═══════════════════════════
Réponds UNIQUEMENT en JSON valide (aucun texte autour, aucun bloc markdown).

STRUCTURE DE RÉPONSE :
{
  "message": "Ta réponse courte en français (2-4 phrases max)",
  "patch": null,
  "generated_day": null
}

── CAS 1 : Adapter la séance existante (douleur, fatigue, peu de temps) ──
{
  "message": "...",
  "patch": {
    "skip": ["id-exact"],
    "modify": { "id-exact": { "sets": "2×6", "note": "raison courte" } },
    "session_note": "résumé court <80 chars"
  },
  "generated_day": null
}

── CAS 2 : Créer/remplacer la journée entière ──
{
  "message": "...",
  "patch": null,
  "generated_day": {
    "title": "Nom de la séance",
    "emoji": "💪",
    "category": "strength",
    "items": [
      {
        "id": "gen-1",
        "category": "strength",
        "activity": "Rameur",
        "label": "Échauffement rameur",
        "duration_min": 5,
        "checked": false
      },
      {
        "id": "gen-2",
        "category": "strength",
        "activity": "Squat bulgare",
        "sets": "3×8",
        "weight": "PC",
        "notes": "RIR 2",
        "checked": false
      }
    ]
  }
}

RÈGLES pour generated_day items :
- "activity" doit correspondre EXACTEMENT à un nom du catalogue ci-dessus si possible
- Si tu crées une nouvelle activité : utilise une casse titre correcte en français
- "category" : movement | strength | recovery | event
- Champs optionnels : label?, sets?, weight?, reps?, duration_min?, km?, elevation_m?, notes?
- Commence toujours par un échauffement. Max 7–8 items.

── CAS 3 : Discussion simple / encouragement ──
patch et generated_day restent null.`
}
