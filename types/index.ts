export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

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

export interface NutritionLog {
  proteines_g: number | null
  collagene_g: number | null
  creatine_g: number | null
  eau_ml: number | null
  notes: string
}

export interface WellbeingLog {
  humeur: number | null        // 1–10
  fatigue: number | null       // 1–10
  stress: number | null        // 1–10
  sommeil_h: number | null     // hours
  alcool_verres: number | null // number of drinks
  douleur_generale: number | null // 0–10
  notes_perso: string
}
