-- ============================================
-- 埋点统计字段升级
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 给 page_views 表添加新字段
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS ua TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS duration INT;  -- 停留时间（秒）
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS type TEXT;     -- 'duration' 标记停留时间记录

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_type ON page_views(type);

-- 添加 RLS 策略（允许匿名更新，用于更新停留时间）
CREATE POLICY "Allow anonymous update" ON page_views FOR UPDATE USING (true);

-- 完成！
SELECT 'Stats tracking upgrade complete! 🐟📊' as status;
