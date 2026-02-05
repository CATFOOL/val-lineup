-- 创建 collections 表 (合集)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 collection_lineups 关联表
CREATE TABLE collection_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, lineup_id)
);

-- 创建索引
CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_published ON collections(is_published) WHERE is_published = true;
CREATE INDEX idx_collection_lineups_collection ON collection_lineups(collection_id);
CREATE INDEX idx_collection_lineups_lineup ON collection_lineups(lineup_id);

-- 启用 RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_lineups ENABLE ROW LEVEL SECURITY;

-- Collections 策略
CREATE POLICY "Published collections or own collections are viewable"
  ON collections FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection Lineups 策略
CREATE POLICY "Collection lineups viewable if collection is viewable"
  ON collection_lineups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_lineups.collection_id
      AND (collections.is_published = true OR collections.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add own lineups to own collections"
  ON collection_lineups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_lineups.collection_id
      AND collections.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = collection_lineups.lineup_id
      AND lineups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove lineups from own collections"
  ON collection_lineups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_lineups.collection_id
      AND collections.user_id = auth.uid()
    )
  );
