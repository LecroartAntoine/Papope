-- Run this in your Neon SQL editor or via `npx drizzle-kit push`

CREATE TABLE IF NOT EXISTS "scores" (
  "id"          serial PRIMARY KEY,
  "player_name" varchar(64) NOT NULL,
  "score"       integer NOT NULL,
  "game"        varchar(32) NOT NULL DEFAULT 'papope',
  "created_at"  timestamp DEFAULT now() NOT NULL
);

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scores_game_score
  ON "scores" ("game", "score" DESC);

-- Index for personal best lookups
CREATE INDEX IF NOT EXISTS idx_scores_player
  ON "scores" ("player_name", "game");
