export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

// ─── Static default template types (kept for fallback) ────────────────────────

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
  type: 'strength' | 'climb' | 'recovery' | 'rest' | 'optional'
  title: string
  subtitle: string
  duration?: string
  sections: WorkoutSection[]
}

// ─── Dynamic day items — the new flexible model ───────────────────────────────

export type DayItemType = 'exercise' | 'climb' | 'hike' | 'cardio' | 'event' | 'rest'

export interface BaseItem {
  id: string          // uuid generated client-side
  type: DayItemType
  checked?: boolean
  skipped?: boolean   // skipped by coach
  coach_note?: string // coach override note
}

export interface ExerciseItem extends BaseItem {
  type: 'exercise'
  name: string
  sets?: string
  reps?: string
  weight?: string     // e.g. "20kg" or "PC"
  notes?: string
}

export interface ClimbItem extends BaseItem {
  type: 'climb'
  label?: string      // e.g. "Séance escalade"
  grade?: string
  style?: string      // À vue, Flash, Redpoint…
  completed?: boolean
  notes?: string
}

export interface HikeItem extends BaseItem {
  type: 'hike'
  label?: string
  km?: number
  elevation_m?: number
  duration_min?: number
  notes?: string
}

export interface CardioItem extends BaseItem {
  type: 'cardio'
  activity: string    // "Rameur", "Course", "Vélo"…
  duration_min?: number
  distance_km?: number
  notes?: string
}

export interface EventItem extends BaseItem {
  type: 'event'
  label: string
  notes?: string
}

export interface RestItem extends BaseItem {
  type: 'rest'
  label?: string
  notes?: string
}

export type DayItem = ExerciseItem | ClimbItem | HikeItem | CardioItem | EventItem | RestItem

// ─── Custom day plan stored in DB ────────────────────────────────────────────

export interface CustomDayPlan {
  date: string
  title: string
  emoji: string
  type: DayItemType | 'mixed'
  items: DayItem[]
  notes?: string
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
