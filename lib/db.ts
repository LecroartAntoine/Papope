import { sql } from '@vercel/postgres'

export { sql }

export async function runMigrations() {
  // Core session data
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
  await sql`
    CREATE TABLE IF NOT EXISTS day_plans (
      id         SERIAL PRIMARY KEY,
      date       DATE        NOT NULL UNIQUE,
      title      TEXT        NOT NULL DEFAULT '',
      emoji      TEXT        NOT NULL DEFAULT '📅',
      type       TEXT        NOT NULL DEFAULT 'mixed',
      items      JSONB       NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Canonical activity registry — AI and users both reference this
  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id                   SERIAL PRIMARY KEY,
      name                 TEXT        NOT NULL UNIQUE,
      category             TEXT        NOT NULL CHECK (category IN ('movement','strength','recovery','event')),
      emoji                TEXT        NOT NULL DEFAULT '🏃',
      default_duration_min INTEGER,
      is_climbing          BOOLEAN     NOT NULL DEFAULT false,
      is_outdoor           BOOLEAN     NOT NULL DEFAULT false,
      has_sets             BOOLEAN     NOT NULL DEFAULT false,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Seed canonical activities (INSERT OR IGNORE pattern)
  await sql`
    INSERT INTO activities (name, category, emoji, default_duration_min, is_climbing, is_outdoor, has_sets)
    VALUES
      ('Escalade',          'movement',  '🧗', 90,  true,  false, false),
      ('Beat Saber',        'movement',  '🥊', 45,  false, false, false),
      ('Randonnée',         'movement',  '🏔', 180, false, true,  false),
      ('Course à pied',     'movement',  '🏃', 40,  false, true,  false),
      ('Rameur',            'movement',  '🚣', 30,  false, false, false),
      ('Vélo',              'movement',  '🚴', 60,  false, true,  false),
      ('Natation',          'movement',  '🏊', 45,  false, false, false),
      ('Marche',            'movement',  '🚶', 60,  false, true,  false),
      ('Tractions',         'strength',  '💪', null,false, false, true),
      ('Squat',             'strength',  '🏋', null,false, false, true),
      ('Pompes',            'strength',  '💪', null,false, false, true),
      ('Développé militaire','strength', '🏋', null,false, false, true),
      ('Fentes bulgares',   'strength',  '🦵', null,false, false, true),
      ('Gainage',           'strength',  '🧱', null,false, false, true),
      ('Curls marteau',     'strength',  '💪', null,false, false, true),
      ('Étirements',        'recovery',  '🧘', 15,  false, false, false),
      ('Mobilité',          'recovery',  '🧘', 20,  false, false, false),
      ('Repos complet',     'event',     '😴', null,false, false, false),
      ('Compétition',       'event',     '🏆', null,false, false, false),
      ('Voyage',            'event',     '✈',  null,false, false, false)
    ON CONFLICT (name) DO NOTHING
  `

  // App settings key-value store
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    INSERT INTO app_settings (key, value) VALUES ('gemini_model', 'gemini-2.5-flash')
    ON CONFLICT (key) DO NOTHING
  `
}

export async function runSupplementMigrations() {
  // Flexible supplement definitions — user/AI editable
  await sql`
    CREATE TABLE IF NOT EXISTS supplements (
      id          SERIAL PRIMARY KEY,
      name        TEXT        NOT NULL,
      unit        TEXT        NOT NULL DEFAULT 'g',
      target      NUMERIC(8,2),
      emoji       TEXT        NOT NULL DEFAULT '💊',
      color       TEXT        NOT NULL DEFAULT '#C8F135',
      hint        TEXT,
      sort_order  INTEGER     NOT NULL DEFAULT 0,
      is_enabled  BOOLEAN     NOT NULL DEFAULT true,
      climb_only  BOOLEAN     NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Daily logs per supplement — replaces rigid nutrition_logs columns
  await sql`
    CREATE TABLE IF NOT EXISTS supplement_logs (
      id            SERIAL PRIMARY KEY,
      date          DATE        NOT NULL,
      supplement_id INTEGER     NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
      value         NUMERIC(8,2),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(date, supplement_id)
    )
  `

  // Seed default supplements (migration-safe)
  await sql`
    INSERT INTO supplements (name, unit, target, emoji, color, hint, sort_order, climb_only)
    VALUES
      ('Protéines',  'g',   150,  '🥩', '#C8F135', null,                              0, false),
      ('Créatine',   'g',   5,    '⚡', '#F5A623', 'Prendre avec de l''eau',           1, false),
      ('Eau',        'ml',  2500, '💧', '#64D8FF', null,                              2, false),
      ('Collagène',  'g',   15,   '🦴', '#4EA8FF', '30–60 min avant la séance',       3, true)
    ON CONFLICT DO NOTHING
  `
}
