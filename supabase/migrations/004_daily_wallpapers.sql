-- 每日壁纸表
CREATE TABLE IF NOT EXISTS daily_wallpapers (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  style TEXT DEFAULT 'random',
  image_url TEXT,
  image_catbox TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_daily_wallpapers_date ON daily_wallpapers(date DESC);

-- RLS
ALTER TABLE daily_wallpapers ENABLE ROW LEVEL SECURITY;

-- 允许匿名读取
CREATE POLICY "Allow anonymous read" ON daily_wallpapers
  FOR SELECT USING (true);

-- 允许匿名插入
CREATE POLICY "Allow anonymous insert" ON daily_wallpapers
  FOR INSERT WITH CHECK (true);
