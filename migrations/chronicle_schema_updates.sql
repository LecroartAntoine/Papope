-- ════════════════════════════════════════════════════════════════════════════
-- FILE: migrations/chronicle_schema_updates.sql
-- DESCRIPTION: Schema updates for Chronicle app bug fixes
-- - Add language_read and dimensions columns to chronicle_reviews
-- - Ensure chronicle_currently_reading table exists
-- - Ensure chronicle_favorites table has proper indexes
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Add language_read column to chronicle_reviews if it doesn't exist
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE chronicle_reviews
ADD COLUMN IF NOT EXISTS language_read VARCHAR(10);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Add dimensions column (JSONB) to chronicle_reviews if it doesn't exist
--    Stores: { readability, writing, length, pacing, originality, emotion }
--    Each value can be 1-5 or null
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE chronicle_reviews
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Ensure chronicle_currently_reading table exists
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chronicle_currently_reading (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES chronicle_books(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(book_id, user_name)
);

CREATE INDEX IF NOT EXISTS idx_currently_reading_book_id ON chronicle_currently_reading(book_id);
CREATE INDEX IF NOT EXISTS idx_currently_reading_user_name ON chronicle_currently_reading(user_name);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Ensure chronicle_favorites table exists
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chronicle_favorites (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES chronicle_books(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(book_id, user_name)
);

CREATE INDEX IF NOT EXISTS idx_favorites_book_id ON chronicle_favorites(book_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_name ON chronicle_favorites(user_name);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Ensure chronicle_reactions table exists
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chronicle_reactions (
  id SERIAL PRIMARY KEY,
  trace_id INTEGER NOT NULL REFERENCES chronicle_reviews(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trace_id, user_name)
);

CREATE INDEX IF NOT EXISTS idx_reactions_trace_id ON chronicle_reactions(trace_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_name ON chronicle_reactions(user_name);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Ensure chronicle_replies table exists
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chronicle_replies (
  id SERIAL PRIMARY KEY,
  trace_id INTEGER NOT NULL REFERENCES chronicle_reviews(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replies_trace_id ON chronicle_replies(trace_id);
CREATE INDEX IF NOT EXISTS idx_replies_author_name ON chronicle_replies(author_name);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Add comment to dimensions column for clarity
-- ────────────────────────────────────────────────────────────────────────────
COMMENT ON COLUMN chronicle_reviews.dimensions IS 
'JSON object storing dimensional ratings. Example: 
{"readability": 4, "writing": 5, "length": 3, "pacing": 5, "originality": 4, "emotion": 5}
Each dimension can be null or a value from 1 to 5.';

COMMENT ON COLUMN chronicle_reviews.language_read IS 
'Language the book was read in. Example: "en", "fr", "de"';

-- ────────────────────────────────────────────────────────────────────────────
-- 8. Verify chronicle_books table has necessary columns
-- ────────────────────────────────────────────────────────────────────────────
-- The chronicle_books table should already exist with: 
-- id, title, author, image_url, categories (array), added_by, added_at, etc.
-- No changes needed unless migrating from old schema.

-- ════════════════════════════════════════════════════════════════════════════
-- Script complete. All tables and columns are now in place.
-- ════════════════════════════════════════════════════════════════════════════
