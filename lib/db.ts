import { sql } from '@vercel/postgres'

export { sql }

export async function runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id            SERIAL PRIMARY KEY,
      date          DATE        NOT NULL UNIQUE,
      exercises     JSONB       NOT NULL DEFAULT '{}',
      skipped       JSONB       NOT NULL DEFAULT '{}',
      modifications JSONB       NOT NULL DEFAULT '{}',
      notes         TEXT        NOT NULL DEFAULT '',
      pain_level    SMALLINT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS skipped       JSONB NOT NULL DEFAULT '{}'`
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS modifications JSONB NOT NULL DEFAULT '{}'`

  await sql`
    CREATE TABLE IF NOT EXISTS body_metrics (
      id         SERIAL PRIMARY KEY,
      date       DATE        NOT NULL UNIQUE,
      weight_kg  NUMERIC(5,2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id           SERIAL PRIMARY KEY,
      date         DATE        NOT NULL UNIQUE,
      proteines_g  NUMERIC(6,1),
      collagene_g  NUMERIC(5,1),
      creatine_g   NUMERIC(4,1),
      eau_ml       INTEGER,
      notes        TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS wellbeing_logs (
      id               SERIAL PRIMARY KEY,
      date             DATE        NOT NULL UNIQUE,
      humeur           SMALLINT,
      fatigue          SMALLINT,
      stress           SMALLINT,
      sommeil_h        NUMERIC(3,1),
      alcool_verres    SMALLINT,
      douleur_generale SMALLINT,
      notes_perso      TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS lift_logs (
      id          SERIAL PRIMARY KEY,
      date        DATE        NOT NULL,
      exercise_id TEXT        NOT NULL,
      exercise    TEXT        NOT NULL,
      sets        SMALLINT,
      reps        SMALLINT,
      weight_kg   NUMERIC(5,2),
      notes       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(date, exercise_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS climb_logs (
      id         SERIAL PRIMARY KEY,
      date       DATE        NOT NULL,
      grade      TEXT        NOT NULL,
      style      TEXT,
      completed  BOOLEAN     NOT NULL DEFAULT false,
      notes      TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS chat_history (
      id         SERIAL PRIMARY KEY,
      date       DATE        NOT NULL,
      role       TEXT        NOT NULL CHECK (role IN ('user', 'coach')),
      content    TEXT        NOT NULL,
      patch      JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}
