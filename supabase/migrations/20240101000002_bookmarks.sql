-- 创建 lineup_bookmarks 表 (收藏)
CREATE TABLE lineup_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lineup_id, user_id)
);

-- 创建索引
CREATE INDEX idx_lineup_bookmarks_user ON lineup_bookmarks(user_id);
CREATE INDEX idx_lineup_bookmarks_lineup ON lineup_bookmarks(lineup_id);

-- 启用 RLS
ALTER TABLE lineup_bookmarks ENABLE ROW LEVEL SECURITY;

-- Bookmarks 策略
CREATE POLICY "Bookmarks are viewable by everyone"
  ON lineup_bookmarks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can bookmark"
  ON lineup_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own bookmarks"
  ON lineup_bookmarks FOR DELETE
  USING (auth.uid() = user_id);
