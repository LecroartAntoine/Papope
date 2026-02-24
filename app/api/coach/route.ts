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

    const [sessionRow, wellbeing, nutrition, painHistory, chatRows, activities, supplements, suppLogs] = await Promise.all([
      sql`SELECT * FROM sessions WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM wellbeing_logs WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT * FROM nutrition_logs WHERE date = ${date}`.then(r => r.rows[0] ?? null),
      sql`SELECT date, pain_level FROM sessions WHERE date >= CURRENT_DATE - 14 AND pain_level IS NOT NULL ORDER BY date ASC`.then(r => r.rows),
      sql`SELECT role, content FROM chat_history WHERE date = ${date} ORDER BY created_at ASC`.then(r => r.rows),
      sql`SELECT name, category, emoji FROM activities ORDER BY category, name`.then(r => r.rows).catch(() => []),
      sql`SELECT id, name, unit, target, emoji, hint, climb_only, is_enabled, sort_order FROM supplements WHERE is_enabled = true ORDER BY sort_order ASC`.then(r => r.rows).catch(() => []),
      sql`SELECT supplement_id, value FROM supplement_logs WHERE date = ${date}`.then(r => r.rows).catch(() => []),
    ])

    const model = await getModel()
    const prompt = buildPrompt({
      date, message, currentDayPlan, currentItems,
      sessionRow, wellbeing, nutrition, painHistory,
      conversationHistory: chatRows.slice(0, -1),
      canonicalActivities: activities,
      supplements,
      suppLogs,
    })
    const rawText = await callGemini(prompt, apiKey, model)

    let coachMessage = rawText
    let patch: any = null
    let generatedDay: any = null
    let supplementPatch: any = null

    try {
      const parsed = parseJson(rawText)
      coachMessage = parsed.message ?? rawText
      patch = parsed.patch ?? null
      generatedDay = parsed.generated_day ?? null
      supplementPatch = parsed.supplement_patch ?? null
    } catch {
      coachMessage = rawText.replace(/```[\s\S]*?```/g, '').trim()
    }

    // Apply supplement patch to logs
    if (supplementPatch?.entries && Array.isArray(supplementPatch.entries)) {
      for (const entry of supplementPatch.entries) {
        if (!entry.supplement_id || entry.value == null) continue
        await sql`
          INSERT INTO supplement_logs (date, supplement_id, value, updated_at)
          VALUES (${date}, ${entry.supplement_id}, ${entry.value}, NOW())
          ON CONFLICT (date, supplement_id) DO UPDATE
            SET value = EXCLUDED.value, updated_at = NOW()
        `.catch(() => {})
      }
    }

    // Register new activities if AI creates them
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

    const patchData = patch || supplementPatch || generatedDay
    await sql`
      INSERT INTO chat_history (date, role, content, patch)
      VALUES (${date}, 'coach', ${coachMessage},
        ${patchData ? JSON.stringify({ patch, supplementPatch, generated_day: !!generatedDay }) : null}::jsonb)
    `

    return NextResponse.json({ message: coachMessage, patch, generatedDay, supplementPatch })
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
    supplements, suppLogs,
  } = ctx

  const itemsList = (currentItems ?? []).map((item: any) => {
    const label = item.label || item.activity || item.name || '?'
    const details = [
      item.sets && `sets=${item.sets}`,
      item.weight && `poids=${item.weight}`,
      item.duration_min && `durée=${item.duration_min}min`,
    ].filter(Boolean).join(', ')
    return `  - id="${item.id}" cat=${item.category ?? 'unknown'} : ${label}${details ? ` (${details})` : ''}`
  }).join('\n') || '  (aucun item planifié)'

  const activityList = (canonicalActivities ?? [])
    .map((a: any) => `  [${a.category}] ${a.emoji} ${a.name}`)
    .join('\n') || '  (catalogue vide)'

  // Build supplement context
  const logsMap: Record<number, number | null> = {}
  ;(suppLogs ?? []).forEach((r: any) => { logsMap[r.supplement_id] = r.value })

  const suppList = (supplements ?? []).map((s: any) => {
    const logged = logsMap[s.id] ?? null
    const pct = s.target && logged != null ? Math.round((logged / s.target) * 100) : null
    return `  - id=${s.id} "${s.name}" (${s.unit})${s.target ? ` objectif=${s.target}` : ''}${logged != null ? ` aujourd'hui=${logged} (${pct}%)` : ' non renseigné'}${s.hint ? ` [${s.hint}]` : ''}`
  }).join('\n') || '  (aucun supplément configuré)'

  const wellbeingSummary = wellbeing
    ? `humeur=${wellbeing.humeur ?? '?'}/10, fatigue=${wellbeing.fatigue ?? '?'}/10, stress=${wellbeing.stress ?? '?'}/10, sommeil=${wellbeing.sommeil_h ?? '?'}h, alcool=${wellbeing.alcool_verres ?? '?'} verres, douleur=${wellbeing.douleur_generale ?? '?'}/10`
    : 'Non renseigné'

  const painAvg = painHistory.length
    ? (painHistory.reduce((s: number, r: any) => s + (r.pain_level ?? 0), 0) / painHistory.length).toFixed(1)
    : null

  const historyText = conversationHistory
    .map((m: any) => `${m.role === 'user' ? 'Utilisateur' : 'Coach'}: ${m.content}`)
    .join('\n')

  return `Tu es un coach sportif et nutritionnel IA dans "Keep Pushing !". Tu adaptes les séances ET le suivi nutrition/suppléments.

PROFIL : 84kg, 1,95m, grimpeur débutant, rétablissement tendineux bras (biceps/avant-bras).
Activités régulières : Escalade (2×/sem), Beat Saber (VR, très physique), Force, Randonnée.
Objectifs : progresser escalade, esthétique, éliminer douleurs.

RÈGLES SPORT :
- Douleur bras ≥4/10 → supprimer exercices bras
- Jamais campus board ni entraînement max doigts
- Toujours échauffement si séance physique

CATALOGUE D'ACTIVITÉS (noms exacts) :
${activityList}

JOURNÉE : ${date} — ${currentDayPlan?.title ?? 'Sans plan'}
Items actuels :
${itemsList}

Douleur bras : ${sessionRow?.pain_level ?? '?'}/10 · Moy 14j : ${painAvg ?? '?'}/10
Bien-être : ${wellbeingSummary}

SUPPLÉMENTS DU JOUR :
${suppList}

${historyText ? `HISTORIQUE :\n${historyText}\n` : ''}
MESSAGE : "${message}"

═══════════════════════════
Réponds UNIQUEMENT en JSON valide (aucun texte autour).

STRUCTURE :
{
  "message": "Réponse courte (2-4 phrases)",
  "patch": null,
  "generated_day": null,
  "supplement_patch": null
}

── CAS SPORT : Adapter la séance existante ──
"patch": { "skip": ["id"], "modify": { "id": { "sets": "2×6", "note": "raison" } }, "session_note": "..." }

── CAS SPORT : Créer/remplacer la journée ──
"generated_day": {
  "title": "...", "emoji": "💪", "category": "strength",
  "items": [{ "id": "gen-1", "category": "strength", "activity": "Rameur", "duration_min": 5, "checked": false }]
}

── CAS NUTRITION : Logger ou ajuster un supplément ──
Utilise supplement_patch quand l'utilisateur dit qu'il a pris quelque chose, ou si tu veux lui rappeler/confirmer.
"supplement_patch": {
  "entries": [
    { "supplement_id": 1, "value": 150 },
    { "supplement_id": 2, "value": 5 }
  ],
  "note": "J'ai mis à jour tes protéines et créatine du jour."
}

── RÈGLES ──
- supplement_id = l'ID exact de la liste des suppléments ci-dessus
- Pour sport + nutrition simultanés : combine patch/generated_day ET supplement_patch
- Si l'utilisateur parle d'un supplément non configuré, suggère-lui de l'ajouter via ⚙ Gérer
- Pour simple conversation : tout à null`
}
