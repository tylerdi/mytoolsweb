-- ============================================
-- 修复 RLS 策略 - 确保 anon 角色可以读写
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 确保所有表的 RLS 策略存在（IF NOT EXISTS 语法不存在于 POLICY，用 DO 块处理）

-- page_views 表
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous read' AND tablename = 'page_views') THEN
    CREATE POLICY "Allow anonymous read" ON page_views FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert' AND tablename = 'page_views') THEN
    CREATE POLICY "Allow anonymous insert" ON page_views FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous update' AND tablename = 'page_views') THEN
    CREATE POLICY "Allow anonymous update" ON page_views FOR UPDATE USING (true);
  END IF;
END $$;

-- site_stats 表
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous read' AND tablename = 'site_stats') THEN
    CREATE POLICY "Allow anonymous read" ON site_stats FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert' AND tablename = 'site_stats') THEN
    CREATE POLICY "Allow anonymous insert" ON site_stats FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous update' AND tablename = 'site_stats') THEN
    CREATE POLICY "Allow anonymous update" ON site_stats FOR UPDATE USING (true);
  END IF;
END $$;

-- checkins 表
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous read' AND tablename = 'checkins') THEN
    CREATE POLICY "Allow anonymous read" ON checkins FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert' AND tablename = 'checkins') THEN
    CREATE POLICY "Allow anonymous insert" ON checkins FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous update' AND tablename = 'checkins') THEN
    CREATE POLICY "Allow anonymous update" ON checkins FOR UPDATE USING (true);
  END IF;
END $$;

-- moods 表
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous read' AND tablename = 'moods') THEN
    CREATE POLICY "Allow anonymous read" ON moods FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert' AND tablename = 'moods') THEN
    CREATE POLICY "Allow anonymous insert" ON moods FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- capsules 表
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous read' AND tablename = 'capsules') THEN
    CREATE POLICY "Allow anonymous read" ON capsules FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert' AND tablename = 'capsules') THEN
    CREATE POLICY "Allow anonymous insert" ON capsules FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous update' AND tablename = 'capsules') THEN
    CREATE POLICY "Allow anonymous update" ON capsules FOR UPDATE USING (true);
  END IF;
END $$;

-- novel_comments 表
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous read' AND tablename = 'novel_comments') THEN
    CREATE POLICY "Allow anonymous read" ON novel_comments FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert' AND tablename = 'novel_comments') THEN
    CREATE POLICY "Allow anonymous insert" ON novel_comments FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- guestbook 表
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous read' AND tablename = 'guestbook') THEN
    CREATE POLICY "Allow anonymous read" ON guestbook FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert' AND tablename = 'guestbook') THEN
    CREATE POLICY "Allow anonymous insert" ON guestbook FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 确保 anon 角色有表级权限
GRANT SELECT, INSERT, UPDATE ON page_views TO anon;
GRANT SELECT, INSERT, UPDATE ON site_stats TO anon;
GRANT SELECT, INSERT, UPDATE ON checkins TO anon;
GRANT SELECT, INSERT, UPDATE ON moods TO anon;
GRANT SELECT, INSERT, UPDATE ON capsules TO anon;
GRANT SELECT, INSERT, UPDATE ON novel_comments TO anon;
GRANT SELECT, INSERT, UPDATE ON guestbook TO anon;

-- 完成
SELECT 'RLS policies fixed! 🐟' as status;
