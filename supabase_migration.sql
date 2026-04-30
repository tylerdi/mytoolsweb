-- ============================================
-- 小鱼儿网站数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 1. 签到表
CREATE TABLE IF NOT EXISTS checkins (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,         -- 访客标识（浏览器指纹或 localStorage ID）
  checkin_date DATE NOT NULL,
  streak INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visitor_id, checkin_date)
);

-- 2. 时间胶囊表
CREATE TABLE IF NOT EXISTS capsules (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  content TEXT NOT NULL,
  open_date DATE NOT NULL,
  is_opened BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 心情日记表
CREATE TABLE IF NOT EXISTS moods (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  mood TEXT NOT NULL,               -- emoji
  note TEXT,
  ai_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 每日一问回答表
CREATE TABLE IF NOT EXISTS question_answers (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  question_date DATE NOT NULL,
  answer TEXT NOT NULL,
  ai_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 小说评论表
CREATE TABLE IF NOT EXISTS novel_comments (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,         -- 如 "chapter-001"
  nickname TEXT DEFAULT '匿名读者',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 访客留言表
CREATE TABLE IF NOT EXISTS guestbook (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  nickname TEXT DEFAULT '匿名访客',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 网站统计表
CREATE TABLE IF NOT EXISTS site_stats (
  id BIGSERIAL PRIMARY KEY,
  stat_date DATE NOT NULL UNIQUE,
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  checkin_count INT DEFAULT 0,
  mood_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 访客在线记录（用于统计）
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  page TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_checkins_visitor ON checkins(visitor_id);
CREATE INDEX IF NOT EXISTS idx_capsules_visitor ON capsules(visitor_id);
CREATE INDEX IF NOT EXISTS idx_moods_visitor ON moods(visitor_id);
CREATE INDEX IF NOT EXISTS idx_novel_comments_chapter ON novel_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(created_at);

-- RLS 策略（允许匿名读写，secret key 可管理）
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- 允许匿名读取
CREATE POLICY "Allow anonymous read" ON checkins FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON capsules FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON moods FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON question_answers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON novel_comments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON guestbook FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON site_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON page_views FOR SELECT USING (true);

-- 允许匿名插入
CREATE POLICY "Allow anonymous insert" ON checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON capsules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON moods FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON question_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON novel_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON guestbook FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON site_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON page_views FOR INSERT WITH CHECK (true);

-- 允许匿名更新（签到需要更新 streak）
CREATE POLICY "Allow anonymous update" ON checkins FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update" ON capsules FOR UPDATE USING (true);

-- 完成！
SELECT 'Database setup complete! 🐟' as status;
