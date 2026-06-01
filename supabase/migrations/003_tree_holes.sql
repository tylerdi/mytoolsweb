-- AI 树洞表
CREATE TABLE IF NOT EXISTS tree_holes (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'unknown',
  ai_reply TEXT,
  hugs INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tree_holes_created ON tree_holes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tree_holes_visitor ON tree_holes(visitor_id);

-- RLS
ALTER TABLE tree_holes ENABLE ROW LEVEL SECURITY;

-- 允许匿名读取（只读公开字段）
CREATE POLICY "Allow anonymous read" ON tree_holes
  FOR SELECT USING (true);

-- 允许匿名插入
CREATE POLICY "Allow anonymous insert" ON tree_holes
  FOR INSERT WITH CHECK (true);

-- 允许匿名更新 hugs 字段
CREATE POLICY "Allow anonymous update hugs" ON tree_holes
  FOR UPDATE USING (true);
