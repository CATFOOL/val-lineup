-- Drop collection_likes and collection_bookmarks tables if they exist
DROP TABLE IF EXISTS collection_bookmarks;
DROP TABLE IF EXISTS collection_likes;

-- Collection Subscriptions table
CREATE TABLE collection_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, user_id)
);

-- Indexes
CREATE INDEX idx_collection_subscriptions_collection ON collection_subscriptions(collection_id);
CREATE INDEX idx_collection_subscriptions_user ON collection_subscriptions(user_id);

-- Enable RLS
ALTER TABLE collection_subscriptions ENABLE ROW LEVEL SECURITY;

-- Collection Subscriptions RLS policies
CREATE POLICY "Anyone can view collection subscriptions"
  ON collection_subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can subscribe to collections"
  ON collection_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe from collections"
  ON collection_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
