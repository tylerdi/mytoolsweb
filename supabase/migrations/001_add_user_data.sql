-- Music/Image favorites
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'music' or 'image'
  item_id TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_favorites_visitor ON favorites(visitor_id, type);

-- Dream interpretations
CREATE TABLE IF NOT EXISTS dreams (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  dream_text TEXT NOT NULL,
  interpretation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dreams_visitor ON dreams(visitor_id);

-- Typing test scores
CREATE TABLE IF NOT EXISTS typing_scores (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  wpm INTEGER NOT NULL,
  accuracy FLOAT NOT NULL,
  duration INTEGER,
  text_sample TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_typing_visitor ON typing_scores(visitor_id);

-- Reading progress
CREATE TABLE IF NOT EXISTS reading_progress (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  scroll_pct FLOAT DEFAULT 0,
  last_read TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visitor_id, chapter_id)
);
CREATE INDEX idx_reading_visitor ON reading_progress(visitor_id);

-- AI image history
CREATE TABLE IF NOT EXISTS images (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  style TEXT,
  url TEXT,
  seed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_images_visitor ON images(visitor_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Allow anon access (since we use visitor_id, not auth)
CREATE POLICY "anon_favorites" ON favorites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_dreams" ON dreams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_typing" ON typing_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_reading" ON reading_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_images" ON images FOR ALL USING (true) WITH CHECK (true);
