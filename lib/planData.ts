import { DayPlan } from '@/types'

export const weekPlan: DayPlan[] = [
  {
    key: 'monday',
    label: 'Lundi',
    emoji: '🟢',
    color: 'accent',
    type: 'strength',
    title: 'Force + Soins Tendons',
    subtitle: '40 min — Renforcement sans surcharger la récupération',
    duration: '40 min',
    sections: [
      {
        title: 'Échauffement (5–7 min)',
        exercises: [
          { id: 'mon-wu-1', name: '5 min rameur tranquille' },
          { id: 'mon-wu-2', name: 'Rotations épaules + élastique' },
        ],
      },
      {
        title: 'Travail principal',
        exercises: [
          { id: 'mon-1', name: 'Tractions scapulaires', sets: '3×8' },
          { id: 'mon-2', name: 'Tractions contrôlées', sets: '3×5', notes: 'Garder 2 reps en réserve' },
          { id: 'mon-3', name: 'Pompes lentes', sets: '3×10–15' },
          { id: 'mon-4', name: 'Curls marteau', sets: '3×12', notes: 'Excentrique lent 3 sec' },
          { id: 'mon-5', name: 'Curls poignet inversés', sets: '3×15', notes: 'Important pour les tendons' },
          { id: 'mon-6', name: 'Gainage — creux corporel ou planche', sets: '3 séries' },
        ],
      },
    ],
  },
  {
    key: 'tuesday',
    label: 'Mardi',
    emoji: '🔵',
    color: 'info',
    type: 'climb',
    title: 'Escalade — Technique + Volume',
    subtitle: 'Séance douce pour les tendons',
    sections: [
      {
        title: 'Structure de séance',
        exercises: [
          { id: 'tue-1', name: '8 min rameur échauffement' },
          { id: 'tue-2', name: '10 min traversées faciles' },
          { id: 'tue-3', name: '4–6 voies à 70–75% effort' },
        ],
      },
      {
        title: 'Points de focus',
        exercises: [
          { id: 'tue-f1', name: 'Bras tendus dans les repos' },
          { id: 'tue-f2', name: 'Précision des pieds' },
          { id: 'tue-f3', name: 'Positions de repos' },
        ],
      },
    ],
  },
  {
    key: 'wednesday',
    label: 'Mercredi',
    emoji: '🥊',
    color: 'info',
    type: 'movement',
    title: 'Beat Saber',
    subtitle: '45 min — Cardio VR, bonne suée !',
    duration: '45 min',
    sections: [
      {
        title: 'Session VR',
        exercises: [
          { id: 'wed-bs-1', name: 'Beat Saber — 45 min', notes: 'Expert ou Expert+ selon la forme' },
          { id: 'wed-bs-2', name: 'Étirements bras après', notes: '5 min — avant-bras et épaules' },
        ],
      },
    ],
  },
  {
    key: 'thursday',
    label: 'Jeudi',
    emoji: '🔴',
    color: 'crit',
    type: 'strength',
    title: 'Force + Base de Puissance',
    subtitle: 'Séance morpho',
    sections: [
      {
        title: 'Échauffement',
        exercises: [
          { id: 'thu-wu', name: 'Échauffement général (5–10 min)' },
        ],
      },
      {
        title: 'Travail principal',
        exercises: [
          { id: 'thu-1', name: 'Tractions', sets: '4×5' },
          { id: 'thu-2', name: 'Développé militaire', sets: '3×8' },
          { id: 'thu-3', name: 'Fentes bulgares', sets: '3×8/jambe' },
          { id: 'thu-4', name: 'Relevés de jambes suspendu', sets: '3×10' },
          { id: 'thu-5', name: 'Curls poignet excentriques', sets: '3×15' },
        ],
      },
    ],
  },
  {
    key: 'friday',
    label: 'Vendredi',
    emoji: '🔵',
    color: 'info',
    type: 'climb',
    title: 'Escalade — Séance Performance',
    subtitle: 'Qualité > Quantité',
    sections: [
      {
        title: 'Structure de séance',
        exercises: [
          { id: 'fri-1', name: 'Échauffement complet' },
          { id: 'fri-2', name: '2 voies faciles' },
          { id: 'fri-3', name: '2 voies modérées' },
          { id: 'fri-4', name: '2–3 voies à la limite', notes: '3–4 min repos entre chaque' },
        ],
      },
    ],
  },
  {
    key: 'saturday',
    label: 'Samedi',
    emoji: '🥊',
    color: 'warn',
    type: 'movement',
    title: 'Beat Saber ou Rando',
    subtitle: 'Cardio plaisir — au choix selon météo et forme',
    sections: [
      {
        title: 'Option A — VR',
        exercises: [
          { id: 'sat-bs-1', name: 'Beat Saber — 30–60 min' },
        ],
      },
      {
        title: 'Option B — Extérieur',
        exercises: [
          { id: 'sat-rando-1', name: 'Randonnée ou marche' },
          { id: 'sat-rando-2', name: 'Zone 2 — pouvoir parler' },
        ],
      },
    ],
  },
  {
    key: 'sunday',
    label: 'Dimanche',
    emoji: '⚪',
    color: 'ash',
    type: 'rest',
    title: 'Repos Complet',
    subtitle: 'Bien manger. Bien dormir. Récupérer.',
    sections: [
      {
        title: 'Récupération',
        exercises: [
          { id: 'sun-1', name: 'Atteindre objectif protéines' },
          { id: 'sun-2', name: 'Dormir 7–9h' },
          { id: 'sun-3', name: 'Balade légère si envie' },
        ],
      },
    ],
  },
]

export const nutritionTargets = {
  proteines_g: 150,
  collagene_g: 15,
  creatine_g: 5,
  eau_ml: 2500,
}
