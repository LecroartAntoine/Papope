import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

const GEMINI_MODEL = 'gemini-2.5-flash'

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function parseJson(raw: string): any {
  try { return JSON.parse(raw.trim()) } catch { /* fall through */ }
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
    const { date, message, currentItems, isClimbDay } = await req.json()
    await sql`INSERT INTO chat_history (date, role, content) VALUES (${date}, 'user', ${message})`

    // Load everything the coach needs in parallel
    const [
      chatRows,
      activities,
      supplements,
      suppLogs,
      weekPlans,
      recentWellbeing,
      recentSessions,
      weightHistory,
      supplementHistory,
    ] = await Promise.all([
      // Today's chat history
      sql`SELECT role, content FROM chat_history WHERE date = ${date} ORDER BY created_at ASC`
        .then(r => r.rows),

      // Activity catalogue
      sql`SELECT id, name, category, emoji, default_duration_min, is_climbing, is_outdoor, has_sets FROM activities ORDER BY category, name`
        .then(r => r.rows).catch(() => []),

      // Supplements relevant for today
      sql`
        SELECT id, name, unit, target, emoji, hint, climb_only, sort_order
        FROM supplements WHERE is_enabled = true
        AND (climb_only = false OR ${isClimbDay ? 'true' : 'false'}::boolean = true)
        ORDER BY sort_order ASC
      `.then(r => r.rows).catch(() => []),

      // Today's supplement logs
      sql`SELECT supplement_id, value FROM supplement_logs WHERE date = ${date}`
        .then(r => r.rows).catch(() => []),

      // Full week of plans (Mon-Sun of current week)
      sql`
        SELECT date::text, title, emoji, type as category, items
        FROM day_plans
        WHERE date >= (${date}::date - INTERVAL '7 days')
          AND date <= (${date}::date + INTERVAL '7 days')
        ORDER BY date ASC
      `.then(r => r.rows).catch(() => []),

      // Last 14 days wellbeing
      sql`
        SELECT date::text, humeur, fatigue, stress, sommeil_h, alcool_verres, douleur_generale
        FROM wellbeing_logs
        WHERE date >= CURRENT_DATE - 14
        ORDER BY date DESC
      `.then(r => r.rows).catch(() => []),

      // Last 14 days sessions (pain, completed items)
      sql`
        SELECT date::text, pain_level, exercises
        FROM sessions
        WHERE date >= CURRENT_DATE - 14
        ORDER BY date DESC
      `.then(r => r.rows).catch(() => []),

      // Weight last 30 days
      sql`
        SELECT date::text, weight_kg FROM body_metrics
        WHERE date >= CURRENT_DATE - 30
        ORDER BY date DESC LIMIT 10
      `.then(r => r.rows).catch(() => []),

      // Supplement logs last 7 days for trends
      sql`
        SELECT sl.date::text, s.name, sl.value, s.unit, s.target
        FROM supplement_logs sl JOIN supplements s ON s.id = sl.supplement_id
        WHERE sl.date >= CURRENT_DATE - 7
        ORDER BY sl.date DESC, s.sort_order ASC
      `.then(r => r.rows).catch(() => []),
    ])

    const prompt = buildPrompt({
      date, message, currentItems, isClimbDay,
      chatHistory: chatRows.slice(0, -1),
      activities,
      supplements,
      suppLogs,
      weekPlans,
      recentWellbeing,
      recentSessions,
      weightHistory,
      supplementHistory,
    })

    const rawText = await callGemini(prompt, apiKey)

    let coachMessage = ''
    let weekPatch: any[] | null = null
    let dayPatch: any | null = null
    let supplementPatch: any | null = null
    let supplementUpdates: any[] | null = null

    try {
      const parsed = parseJson(rawText)
      coachMessage = parsed.message ?? ''
      weekPatch = parsed.week_plan ?? null          // Array of { date, title, emoji, category, items[] }
      dayPatch = parsed.day_patch ?? null           // { date, patch: { skip[], modify{} }, session_note }
      supplementPatch = parsed.supplement_patch ?? null  // { entries: [{supplement_id, value}] }
      supplementUpdates = parsed.supplement_updates ?? null // [{id, name, unit, target, hint, emoji, is_enabled, climb_only}] — create/update supplement defs
    } catch {
      coachMessage = rawText.replace(/```[\s\S]*?```/g, '').trim()
    }

    // ── Apply week plan (bulk upsert) ─────────────────────────────────────────
    if (weekPatch && Array.isArray(weekPatch)) {
      for (const day of weekPatch) {
        if (!day.date) continue
        // Register any new activities
        if (day.items) {
          for (const item of day.items) {
            if (!item.activity) continue
            await sql`
              INSERT INTO activities (name, category, emoji)
              VALUES (${item.activity}, ${item.category ?? 'movement'}, ${item.emoji ?? '🏃'})
              ON CONFLICT (name) DO NOTHING
            `.catch(() => {})
          }
        }
        await sql`
          INSERT INTO day_plans (date, title, emoji, type, items, updated_at)
          VALUES (${day.date}, ${day.title ?? ''}, ${day.emoji ?? '📅'}, ${day.category ?? 'mixed'}, ${JSON.stringify(day.items ?? [])}::jsonb, NOW())
          ON CONFLICT (date) DO UPDATE SET
            title = EXCLUDED.title, emoji = EXCLUDED.emoji,
            type = EXCLUDED.type, items = EXCLUDED.items, updated_at = NOW()
        `.catch(() => {})
      }
    }

    // ── Apply day patch (skip/modify on today's items) ────────────────────────
    if (dayPatch) {
      const targetDate = dayPatch.date ?? date
      const { rows: existing } = await sql`
        SELECT items FROM day_plans WHERE date = ${targetDate}
      `.catch(() => ({ rows: [] }))

      if (existing.length) {
        let items = existing[0].items as any[]
        if (dayPatch.patch?.skip) {
          items = items.map((i: any) => dayPatch.patch.skip.includes(i.id)
            ? { ...i, skipped: true, coach_note: dayPatch.patch.skip_reason ?? 'Retiré par le coach' }
            : i)
        }
        if (dayPatch.patch?.modify) {
          items = items.map((i: any) => dayPatch.patch.modify[i.id]
            ? { ...i, ...dayPatch.patch.modify[i.id], coach_note: dayPatch.patch.modify[i.id].note }
            : i)
        }
        if (dayPatch.session_note && !dayPatch.patch?.skip?.length && !dayPatch.patch?.modify) {
          // note-only update — leave items unchanged
        }
        await sql`
          UPDATE day_plans SET items = ${JSON.stringify(items)}::jsonb, updated_at = NOW()
          WHERE date = ${targetDate}
        `.catch(() => {})
      }
    }

    // ── Apply supplement log entries ──────────────────────────────────────────
    if (supplementPatch?.entries && Array.isArray(supplementPatch.entries)) {
      for (const entry of supplementPatch.entries) {
        if (!entry.supplement_id || entry.value == null) continue
        await sql`
          INSERT INTO supplement_logs (date, supplement_id, value, updated_at)
          VALUES (${entry.date ?? date}, ${entry.supplement_id}, ${entry.value}, NOW())
          ON CONFLICT (date, supplement_id) DO UPDATE
            SET value = EXCLUDED.value, updated_at = NOW()
        `.catch(() => {})
      }
    }

    // ── Update supplement definitions (create/update targets/units) ───────────
    if (supplementUpdates && Array.isArray(supplementUpdates)) {
      for (const s of supplementUpdates) {
        if (s.id) {
          // Update existing
          await sql`
            UPDATE supplements SET
              name = COALESCE(${s.name ?? null}, name),
              unit = COALESCE(${s.unit ?? null}, unit),
              target = COALESCE(${s.target ?? null}::numeric, target),
              hint = COALESCE(${s.hint ?? null}, hint),
              emoji = COALESCE(${s.emoji ?? null}, emoji),
              is_enabled = COALESCE(${s.is_enabled ?? null}::boolean, is_enabled),
              climb_only = COALESCE(${s.climb_only ?? null}::boolean, climb_only),
              updated_at = NOW()
            WHERE id = ${s.id}
          `.catch(() => {})
        } else if (s.name) {
          // Create new supplement
          await sql`
            INSERT INTO supplements (name, unit, target, emoji, hint, sort_order, climb_only)
            VALUES (${s.name}, ${s.unit ?? 'g'}, ${s.target ?? null}, ${s.emoji ?? '💊'}, ${s.hint ?? null}, ${s.sort_order ?? 99}, ${s.climb_only ?? false})
            ON CONFLICT DO NOTHING
          `.catch(() => {})
        }
      }
    }

    // ── Save coach reply to history ───────────────────────────────────────────
    const hasPatchData = weekPatch || dayPatch || supplementPatch || supplementUpdates
    await sql`
      INSERT INTO chat_history (date, role, content, patch)
      VALUES (${date}, 'coach', ${coachMessage},
        ${hasPatchData ? JSON.stringify({ weekPatch: !!weekPatch, dayPatch: !!dayPatch, supplementPatch: !!supplementPatch, supplementUpdates: !!supplementUpdates }) : null}::jsonb)
    `

    return NextResponse.json({
      message: coachMessage,
      weekPatch,
      dayPatch,
      supplementPatch,
      supplementUpdates,
    })
  } catch (err: any) {
    console.error('Coach error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function buildPrompt(ctx: any): string {
  const {
    date, message, currentItems, isClimbDay,
    chatHistory, activities, supplements, suppLogs,
    weekPlans, recentWellbeing, recentSessions,
    weightHistory, supplementHistory,
  } = ctx

  // ── Supplements ────────────────────────────────────────────────────────────
  const logsMap: Record<number, number | null> = {}
  ;(suppLogs ?? []).forEach((r: any) => { logsMap[r.supplement_id] = r.value })
  const suppLines = (supplements ?? []).map((s: any) => {
    const logged = logsMap[s.id] ?? null
    const pct = s.target && logged != null ? Math.round((logged / s.target) * 100) : null
    return `  id=${s.id} "${s.name}" [${s.unit}] cible=${s.target ?? '?'} → ${logged != null ? `${logged}${s.unit} (${pct}%)` : 'non renseigné'}${s.hint ? ` 💡${s.hint}` : ''}${s.climb_only ? ' [escalade]' : ''}`
  }).join('\n') || '  (aucun)'

  // ── Supplement trend (last 7 days) ─────────────────────────────────────────
  const suppTrend = (() => {
    const bySupp: Record<string, string[]> = {}
    for (const row of (supplementHistory ?? [])) {
      const k = `${row.name} (${row.unit})`
      if (!bySupp[k]) bySupp[k] = []
      const pct = row.target ? Math.round((row.value / row.target) * 100) : null
      bySupp[k].push(`${row.date.slice(5)}: ${row.value}${row.unit}${pct ? ` (${pct}%)` : ''}`)
    }
    return Object.entries(bySupp).map(([k, v]) => `  ${k}: ${v.slice(0, 5).join(', ')}`).join('\n') || '  (aucune donnée)'
  })()

  // ── Week context ───────────────────────────────────────────────────────────
  const weekLines = (weekPlans ?? []).map((p: any) => {
    const d = p.date?.slice ? p.date : String(p.date)
    const mark = d === date ? '◀ AUJOURD\'HUI' : ''
    const itemsSummary = (p.items ?? []).map((i: any) =>
      `${i.checked ? '✓' : '○'} ${i.activity ?? i.label ?? '?'}${i.sets ? ` ${i.sets}` : ''}${i.duration_min ? ` ${i.duration_min}min` : ''}`
    ).join(', ')
    return `  ${d} ${p.emoji ?? ''} "${p.title ?? 'Sans titre'}" [${p.category ?? 'mixed'}] ${mark}\n    Items: ${itemsSummary || '(vide)'}`
  }).join('\n') || '  (aucun plan cette semaine)'

  // ── Today's items ──────────────────────────────────────────────────────────
  const todayItems = (currentItems ?? []).map((i: any) => {
    const details = [
      i.sets && `sets=${i.sets}`,
      i.weight && `poids=${i.weight}`,
      i.duration_min && `${i.duration_min}min`,
      i.km && `${i.km}km`,
    ].filter(Boolean).join(' ')
    return `  id="${i.id}" [${i.category}] ${i.emoji ?? ''} ${i.activity}${details ? ` — ${details}` : ''} ${i.checked ? '✓' : '○'}${i.skipped ? ' (skipped)' : ''}`
  }).join('\n') || '  (aucun item aujourd\'hui)'

  // ── Wellbeing trend ────────────────────────────────────────────────────────
  const wellbeingLines = (recentWellbeing ?? []).slice(0, 7).map((w: any) =>
    `  ${w.date?.slice ? w.date.slice(5) : w.date}: humeur=${w.humeur ?? '?'} fatigue=${w.fatigue ?? '?'} stress=${w.stress ?? '?'} sommeil=${w.sommeil_h ?? '?'}h douleur=${w.douleur_generale ?? '?'}`
  ).join('\n') || '  (aucune donnée)'

  // ── Pain history ───────────────────────────────────────────────────────────
  const painLines = (recentSessions ?? []).filter((s: any) => s.pain_level != null).slice(0, 7).map((s: any) => {
    const completed = s.exercises ? Object.values(s.exercises).filter(Boolean).length : 0
    return `  ${s.date?.slice ? s.date.slice(5) : s.date}: douleur=${s.pain_level}/10 tâches_complétées=${completed}`
  }).join('\n') || '  (aucune douleur enregistrée)'

  // ── Weight ─────────────────────────────────────────────────────────────────
  const weightLines = (weightHistory ?? []).slice(0, 5).map((w: any) =>
    `  ${w.date?.slice ? w.date.slice(5) : w.date}: ${w.weight_kg}kg`
  ).join('\n') || '  (non renseigné)'

  // ── Activity catalogue ─────────────────────────────────────────────────────
  const activityLines = (activities ?? []).map((a: any) =>
    `  [${a.category}] ${a.emoji} "${a.name}"${a.default_duration_min ? ` ~${a.default_duration_min}min` : ''}${a.is_climbing ? ' [escalade]' : ''}${a.has_sets ? ' [sets/reps]' : ''}`
  ).join('\n') || '  (catalogue vide)'

  // ── Chat history ───────────────────────────────────────────────────────────
  const chatLines = (chatHistory ?? []).slice(-8).map((m: any) =>
    `${m.role === 'user' ? 'Moi' : 'Coach'}: ${m.content}`
  ).join('\n')

  return `Tu es le coach personnel de sport et nutrition de "Keep Pushing !". Tu es à la fois un coach sportif expert, un nutritionniste, et un planificateur. Tu peux TOUT modifier : les plans de la semaine, les suppléments, les objectifs. Tu connais tout l'historique.

━━━ PROFIL ━━━
Homme, 84kg, 1,95m. En rétablissement tendineux des bras (biceps/avant-bras) — prudence sur les exercices tirant sur les bras.
Sports pratiqués : Escalade, Beat Saber (VR intense), Force, Randonnée.
Objectifs : progresser en escalade, esthétique, zéro douleur.

━━━ CONTEXTE — ${date} ━━━
Jour d'escalade : ${isClimbDay ? 'OUI 🧗' : 'non'}

Plan du jour actuel :
${todayItems}

Suppléments du jour :
${suppLines}

━━━ DONNÉES RÉCENTES ━━━

Planning semaine (±7 jours autour d'aujourd'hui) :
${weekLines}

Bien-être (14 derniers jours) :
${wellbeingLines}

Douleur bras & sessions :
${painLines}

Poids :
${weightLines}

Tendance suppléments (7 jours) :
${suppTrend}

━━━ CATALOGUE D'ACTIVITÉS ━━━
${activityLines}

━━━ SUPPLÉMENTS CONFIGURÉS (IDs pour les patches) ━━━
${suppLines}

${chatLines ? `━━━ HISTORIQUE DU CHAT ━━━\n${chatLines}\n` : ''}
━━━ MESSAGE ━━━
"${message}"

━━━ FORMAT DE RÉPONSE ━━━

Réponds en JSON strict. "message" est obligatoire, tout le reste est null si non utilisé.

{
  "message": "Réponse en français, naturelle et directe. Texte pur, pas de markdown. Peut être longue si la question le demande. Explique ce que tu fais quand tu modifies quelque chose.",

  "week_plan": null,
  "day_patch": null,
  "supplement_patch": null,
  "supplement_updates": null
}

━━━ QUAND ET COMMENT UTILISER CHAQUE ACTION ━━━

【week_plan】— Planifier plusieurs jours d'un coup (toute une semaine, les 3 prochains jours, etc.)
Utilise quand l'utilisateur demande une planification sur plusieurs jours.
"week_plan": [
  {
    "date": "YYYY-MM-DD",
    "title": "Force Upper Body",
    "emoji": "💪",
    "category": "strength",
    "items": [
      { "id": "gen-abc1", "category": "strength", "activity": "Tractions", "sets": "4×6", "weight": "PC", "notes": "Excentrique lent", "checked": false },
      { "id": "gen-abc2", "category": "strength", "activity": "Gainage", "duration_min": 10, "checked": false }
    ]
  }
]
→ Tu peux inclure N jours. Les jours non inclus ne sont pas modifiés.
→ Pour une journée de repos : category="recovery", items=[{ "activity": "Repos complet", "category": "recovery" }]
→ Utilise les noms exacts du catalogue. Si l'activité n'existe pas encore, crée-la avec un nom clair.

【day_patch】— Modifier un jour spécifique (souvent hier ou aujourd'hui)
"day_patch": {
  "date": "YYYY-MM-DD",
  "patch": {
    "skip": ["item-id"],
    "modify": { "item-id": { "sets": "2×5", "notes": "Allégé pour récupération", "note": "..." } }
  },
  "session_note": "Note résumant le changement"
}

【supplement_patch】— Logger les valeurs prises aujourd'hui (ou un autre jour)
"supplement_patch": {
  "entries": [
    { "supplement_id": 1, "value": 140, "date": "YYYY-MM-DD" }
  ]
}
→ Omets "date" pour utiliser aujourd'hui.

【supplement_updates】— Modifier les définitions des suppléments (cibles, unités, créer nouveau)
"supplement_updates": [
  { "id": 1, "target": 120 },
  { "id": 3, "target": 3000 },
  { "name": "Magnésium", "unit": "mg", "target": 300, "emoji": "🧲", "hint": "Le soir avec repas" }
]
→ Avec "id" = modifier existant. Sans "id" mais avec "name" = créer nouveau.

━━━ RÈGLES IMPORTANTES ━━━
- Ne propose des modifications QUE si l'utilisateur le demande, ou si c'est clairement nécessaire (douleur ≥4/10 → retirer exos bras)
- Pour les conseils ou questions : réponds uniquement dans "message", laisse tout le reste à null
- Tu peux combiner plusieurs actions en une seule réponse (ex: week_plan + supplement_updates)
- Douleur bras ≥4/10 : TOUJOURS retirer ou alléger les exercices bras dans le plan concerné
- Génère des IDs uniques et courts pour les nouveaux items (ex: "gen-x7k2")
- Quand tu planifies une semaine, intègre les données de bien-être et douleur pour doser l'intensité`
}
