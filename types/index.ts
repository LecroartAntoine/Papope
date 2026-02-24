export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

// ─── Static default template types ───────────────────────────────────────────

export interface Exercise {
  id: string
  name: string
  sets?: string
  notes?: string
}

export interface WorkoutSection {
  title: string
  exercises: Exercise[]
}

export interface DayPlan {
  key: DayKey
  label: string
  emoji: string
  color: string
  type: 'strength' | 'climb' | 'recovery' | 'rest' | 'optional' | 'movement'
  title: string
  subtitle: string
  duration?: string
  sections: WorkoutSection[]
}

// ─── Activity system — broad categories, flexible activities ─────────────────
//
// CATEGORY = broad code-level bucket (4 values, never changes)
// ACTIVITY  = specific named activity stored in DB, user/AI extensible
//
// This allows BeatSaber, Escalade, Randonnée, Yoga, etc. to all exist
// without adding new TypeScript types. The AI uses a canonical list from
// the DB to avoid naming the same thing twice.

export type ActivityCategory = 'movement' | 'strength' | 'recovery' | 'event'

export const CATEGORY_META: Record<ActivityCategory, {
  label: string
  emoji: string
  color: string
  desc: string
}> = {
  movement:  { label: 'Mouvement',    emoji: '🏃', color: '#4EA8FF', desc: 'Cardio, sport, activité physique libre' },
  strength:  { label: 'Force',        emoji: '💪', color: '#C8F135', desc: 'Musculation, exercices de résistance' },
  recovery:  { label: 'Récupération', emoji: '🧘', color: '#A78BFA', desc: 'Mobilité, étirements, repos actif' },
  event:     { label: 'Événement',    emoji: '📌', color: '#F5A623', desc: 'Compétition, blessure, voyage, repos' },
}

// ─── Unified DayItem — flat structure, all fields optional ───────────────────

export interface DayItem {
  id: string                    // short uid
  category: ActivityCategory
  activity: string              // canonical name e.g. "Escalade", "Beat Saber", "Squat"
  label?: string                // optional display override
  checked?: boolean
  skipped?: boolean             // set by coach AI
  coach_note?: string           // set by coach AI

  // Strength fields
  sets?: string                 // "3×8"
  reps?: string                 // "8"
  weight?: string               // "20kg" / "PC"

  // Movement / outdoor fields
  duration_min?: number
  km?: number
  elevation_m?: number
  distance_km?: number

  // Universal
  notes?: string
}

// ─── Custom day plan stored in DB ────────────────────────────────────────────

export interface CustomDayPlan {
  date: string
  title: string
  emoji: string
  category: ActivityCategory | 'mixed'
  items: DayItem[]
}

// ─── Canonical activity registry (loaded from DB) ────────────────────────────

export interface ActivityDef {
  id: number
  name: string                  // canonical casing e.g. "Beat Saber"
  category: ActivityCategory
  emoji: string
  default_duration_min?: number
  is_climbing?: boolean         // shows climb logger
  is_outdoor?: boolean          // shows km/D+ fields
  has_sets?: boolean            // shows sets/reps/weight fields
  created_at: string
}

// ─── App settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  gemini_model: string
  [key: string]: string
}

// ─── Nutrition & wellbeing ───────────────────────────────────────────────────

export interface NutritionLog {
  proteines_g: number | null
  collagene_g: number | null
  creatine_g: number | null
  eau_ml: number | null
  notes: string
}

export interface WellbeingLog {
  humeur: number | null
  fatigue: number | null
  stress: number | null
  sommeil_h: number | null
  alcool_verres: number | null
  douleur_generale: number | null
  notes_perso: string
}
