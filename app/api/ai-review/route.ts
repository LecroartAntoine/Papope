import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { rows: sessions } = await sql`
      SELECT date, exercises, notes, pain_level
      FROM sessions
      WHERE date >= CURRENT_DATE - 7
      ORDER BY date ASC
    `
    const { rows: bodyMetrics } = await sql`
      SELECT date, weight_kg FROM body_metrics
      WHERE date >= CURRENT_DATE - 7
      ORDER BY date ASC
    `
    const { rows: lifts } = await sql`
      SELECT date, exercise, sets, reps, weight_kg
      FROM lift_logs WHERE date >= CURRENT_DATE - 7 ORDER BY date ASC
    `
    const { rows: climbs } = await sql`
      SELECT date, grade, style, completed, notes
      FROM climb_logs WHERE date >= CURRENT_DATE - 7 ORDER BY date ASC
    `
    const { rows: painHistory } = await sql`
      SELECT date, pain_level FROM sessions
      WHERE date >= CURRENT_DATE - 28 AND pain_level IS NOT NULL
      ORDER BY date ASC
    `
    const { rows: nutrition } = await sql`
      SELECT date, proteines_g, collagene_g, creatine_g, eau_ml
      FROM nutrition_logs WHERE date >= CURRENT_DATE - 7 ORDER BY date ASC
    `
    const { rows: wellbeing } = await sql`
      SELECT date, humeur, fatigue, stress, sommeil_h, alcool_verres, douleur_generale, notes_perso
      FROM wellbeing_logs WHERE date >= CURRENT_DATE - 7 ORDER BY date ASC
    `

    const prompt = buildPrompt({ sessions, bodyMetrics, lifts, climbs, painHistory, nutrition, wellbeing })

    // Use Google Gemini API (free tier: 1.5 Flash — 1M context, 15 req/min free)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY manquant dans les variables d\'environnement')

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      throw new Error(`Gemini API error: ${err}`)
    }

    const geminiData = await geminiRes.json()
    const review = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Aucune réponse de l\'IA.'

    return NextResponse.json({ review })
  } catch (err) {
    console.error('AI Review error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function buildPrompt(data: any): string {
  const { sessions, bodyMetrics, lifts, climbs, painHistory, nutrition, wellbeing } = data

  const painAvg = painHistory.length
    ? (painHistory.reduce((s: number, r: any) => s + (r.pain_level ?? 0), 0) / painHistory.length).toFixed(1)
    : 'pas de données'

  const sessionsSummary = sessions.map((s: any) => {
    const checked = Object.values(s.exercises || {}).filter(Boolean).length
    const total = Object.keys(s.exercises || {}).length
    return `${s.date}: ${checked}/${total} exercices cochés, douleur=${s.pain_level ?? 'non renseignée'}, notes="${s.notes || 'aucune'}"`
  }).join('\n') || 'Aucune séance cette semaine'

  const liftsSummary = lifts.map((l: any) =>
    `${l.date} — ${l.exercise}: ${l.sets ?? '?'}×${l.reps ?? '?'} @ ${l.weight_kg ? l.weight_kg + 'kg' : 'poids de corps'}`
  ).join('\n') || 'Aucun exercice loggé'

  const climbSummary = (() => {
    const total = climbs.length
    const sent = climbs.filter((c: any) => c.completed).length
    const grades = climbs.filter((c: any) => c.completed).map((c: any) => c.grade).join(', ')
    return `${total} voies (${sent} enchaînées), cotations : ${grades || 'aucune'}`
  })()

  const weightEntries = bodyMetrics.map((m: any) => `${m.date}: ${m.weight_kg}kg`).join(', ') || 'non renseigné'

  const nutritionSummary = nutrition.map((n: any) =>
    `${n.date}: protéines=${n.proteines_g ?? '?'}g, collagène=${n.collagene_g ?? '?'}g, créatine=${n.creatine_g ?? '?'}g, eau=${n.eau_ml ?? '?'}ml`
  ).join('\n') || 'Aucune nutrition loggée'

  const wellbeingSummary = wellbeing.map((w: any) =>
    `${w.date}: humeur=${w.humeur ?? '?'}/10, fatigue=${w.fatigue ?? '?'}/10, stress=${w.stress ?? '?'}/10, sommeil=${w.sommeil_h ?? '?'}h, alcool=${w.alcool_verres ?? '?'} verres, douleur_générale=${w.douleur_generale ?? '?'}/10`
  ).join('\n') || 'Aucun bien-être loggé'

  return `Tu es un coach sportif et de vie personnel qui fait le bilan hebdomadaire d'un grimpeur débutant en voies.

PROFIL : 84 kg, 1,95 m, grimpeur débutant en rétablissement d'une douleur tendineuse (biceps distal / brachio-antérieur / fléchisseurs avant-bras). Objectifs : grimper des voies plus dures, développer un physique esthétique, éliminer les douleurs tendineuses.

PROGRAMME : Lundi=Force+Tendons, Mardi=Escalade(technique), Mercredi=Récupération, Jeudi=Force+Puissance, Vendredi=Escalade(performance), Samedi=Rando optionnelle, Dimanche=Repos. Objectifs journaliers : 150g protéines, 15g collagène, 5g créatine.

RÈGLES IMPORTANTES : Pas de campus board avant 6-9 mois. Pas d'entraînement max des doigts. Décharge toutes les 4 semaines (-30% volume). Douleur ≥4/10 à l'escalade → arrêter.

DONNÉES DES 7 DERNIERS JOURS :

Séances :
${sessionsSummary}

Exercices loggés :
${liftsSummary}

Escalade : ${climbSummary}

Poids : ${weightEntries}

Nutrition :
${nutritionSummary}

Bien-être quotidien :
${wellbeingSummary}

Tendance douleur bras (28 derniers jours, moy.) : ${painAvg}/10

Fais un bilan COURT ET PRATIQUE EN FRANÇAIS avec :
1. Ce qui s'est bien passé cette semaine (2-3 phrases max)
2. Ce qui mérite attention (douleur, sommeil, alcool, stress, nutrition — sois précis et factuel)
3. Ajustements concrets pour LA SEMAINE PROCHAINE (3-5 points avec des chiffres précis)
4. Un conseil de vie / récupération basé sur les données de bien-être

Sois direct, bienveillant, factuel. Cite les vraies données. Pas de blabla. 300 mots max.`
}
