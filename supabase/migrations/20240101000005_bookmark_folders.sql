-- 创建 bookmark_folders 表（收藏夹）
CREATE TABLE bookmark_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 lineup_bookmarks 添加 folder_id 字段
ALTER TABLE lineup_bookmarks ADD COLUMN folder_id UUID REFERENCES bookmark_folders(id) ON DELETE CASCADE;

-- 删除旧的 unique 约束，添加新的约束（同一用户可以将同一 lineup 收藏到不同收藏夹）
ALTER TABLE lineup_bookmarks DROP CONSTRAINT IF EXISTS lineup_bookmarks_lineup_id_user_id_key;
ALTER TABLE lineup_bookmarks ADD CONSTRAINT lineup_bookmarks_lineup_folder_unique UNIQUE(lineup_id, folder_id);

-- 索引
CREATE INDEX idx_bookmark_folders_user ON bookmark_folders(user_id);
CREATE INDEX idx_lineup_bookmarks_folder ON lineup_bookmarks(folder_id);

-- RLS
ALTER TABLE bookmark_folders ENABLE ROW LEVEL SECURITY;

-- Bookmark Folders 策略（收藏夹只有自己可见）
CREATE POLICY "Users can view own bookmark folders"
  ON bookmark_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmark folders"
  ON bookmark_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmark folders"
  ON bookmark_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmark folders"
  ON bookmark_folders FOR DELETE
  USING (auth.uid() = user_id);
