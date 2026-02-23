# Keep Pushing ! — Suivi Sport, Nutrition & Bien-être

Application personnelle de suivi sportif, nutritionnel et de bien-être.

**Stack :** Next.js 14 App Router · NextAuth · Vercel Postgres (Neon) · Recharts · Google Gemini API (gratuit)

---

## Démarrage local

```bash
npm install
cp .env.example .env.local
# Remplir .env.local
npm run dev
```

---

## Déployer sur Vercel

### 1. Pusher sur GitHub, importer sur Vercel

### 2. Ajouter Vercel Postgres

Dashboard Vercel → **Storage** → **Create Database** → **Postgres (Neon)** → Connect.
Les variables `POSTGRES_*` sont ajoutées automatiquement.

### 3. Variables d'environnement

| Variable | Valeur |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Ton URL Vercel ex. `https://keep-pushing.vercel.app` |
| `APP_USERNAME` | Ton identifiant |
| `APP_PASSWORD` | Ton mot de passe |
| `GEMINI_API_KEY` | Clé gratuite sur [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `POSTGRES_*` | Auto-rempli par Vercel Postgres |

### 4. Migrations DB (une seule fois)

```
https://ton-app.vercel.app/api/migrate
```

Crée les 6 tables. Sûr à relancer — utilise `IF NOT EXISTS`.

---

## Fonctionnalités

| Onglet | Contenu |
|---|---|
| **Jour → Sport** | Checklist exercices, logger séries/reps/poids, logger voies escalade, douleur bras |
| **Jour → Nutrition** | Saisie manuelle protéines/collagène/créatine/eau avec barres de progression |
| **Jour → Bien-être** | Humeur, fatigue, stress, sommeil, alcool, douleur générale, notes perso |
| **Semaine** | Vue d'ensemble des 7 jours avec % complétion |
| **Progrès** | Graphiques : douleur, poids, bien-être, nutrition, escalade |
| **Coach IA** | Bilan hebdomadaire par **Google Gemini 2.5 Flash** (API gratuite) |

## Schéma base de données

```
sessions        — exercices cochés, notes, douleur bras
body_metrics    — poids corporel quotidien
nutrition_logs  — protéines, collagène, créatine, eau (saisie manuelle en grammes)
wellbeing_logs  — humeur, fatigue, stress, sommeil, alcool, douleur générale, notes
lift_logs       — séries/reps/poids par exercice
climb_logs      — voies avec cotation, style, enchaîné/projet
```

## Coach IA — Google Gemini (gratuit)

Le modèle **Gemini 2.5 Flash** est gratuit :
- 15 requêtes/minute
- 1 million de tokens de contexte
- Pas de carte bancaire requise

Obtenir une clé : [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
