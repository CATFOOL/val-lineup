-- Fix auth_rls_initplan warnings by wrapping auth.uid() with (select auth.uid())
-- This prevents the function from being re-evaluated for each row

-- ============================================
-- profiles table
-- ============================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- ============================================
-- lineups table
-- ============================================

DROP POLICY IF EXISTS "Published lineups are viewable by everyone" ON lineups;
CREATE POLICY "Published lineups are viewable by everyone"
  ON lineups FOR SELECT
  USING (is_published = true OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create lineups" ON lineups;
CREATE POLICY "Users can create lineups"
  ON lineups FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own lineups" ON lineups;
CREATE POLICY "Users can update own lineups"
  ON lineups FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own lineups" ON lineups;
CREATE POLICY "Users can delete own lineups"
  ON lineups FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- lineup_media table
-- ============================================

DROP POLICY IF EXISTS "Media viewable if lineup is viewable" ON lineup_media;
CREATE POLICY "Media viewable if lineup is viewable"
  ON lineup_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = lineup_media.lineup_id
      AND (lineups.is_published = true OR lineups.user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can add media to own lineups" ON lineup_media;
CREATE POLICY "Users can add media to own lineups"
  ON lineup_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = lineup_media.lineup_id
      AND lineups.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update media on own lineups" ON lineup_media;
CREATE POLICY "Users can update media on own lineups"
  ON lineup_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = lineup_media.lineup_id
      AND lineups.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete media from own lineups" ON lineup_media;
CREATE POLICY "Users can delete media from own lineups"
  ON lineup_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = lineup_media.lineup_id
      AND lineups.user_id = (select auth.uid())
    )
  );

-- ============================================
-- lineup_likes table
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can like" ON lineup_likes;
CREATE POLICY "Authenticated users can like"
  ON lineup_likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove own likes" ON lineup_likes;
CREATE POLICY "Users can remove own likes"
  ON lineup_likes FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- lineup_bookmarks table
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can bookmark" ON lineup_bookmarks;
CREATE POLICY "Authenticated users can bookmark"
  ON lineup_bookmarks FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove own bookmarks" ON lineup_bookmarks;
CREATE POLICY "Users can remove own bookmarks"
  ON lineup_bookmarks FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- bookmark_folders table
-- ============================================

DROP POLICY IF EXISTS "Users can view own bookmark folders" ON bookmark_folders;
CREATE POLICY "Users can view own bookmark folders"
  ON bookmark_folders FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create bookmark folders" ON bookmark_folders;
CREATE POLICY "Users can create bookmark folders"
  ON bookmark_folders FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own bookmark folders" ON bookmark_folders;
CREATE POLICY "Users can update own bookmark folders"
  ON bookmark_folders FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmark folders" ON bookmark_folders;
CREATE POLICY "Users can delete own bookmark folders"
  ON bookmark_folders FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- collections table
-- ============================================

DROP POLICY IF EXISTS "Published collections or own collections are viewable" ON collections;
CREATE POLICY "Published collections or own collections are viewable"
  ON collections FOR SELECT
  USING (is_published = true OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create collections" ON collections;
CREATE POLICY "Users can create collections"
  ON collections FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON collections;
CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON collections;
CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- collection_lineups table
-- ============================================

DROP POLICY IF EXISTS "Collection lineups viewable if collection is viewable" ON collection_lineups;
CREATE POLICY "Collection lineups viewable if collection is viewable"
  ON collection_lineups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_lineups.collection_id
      AND (collections.is_published = true OR collections.user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can add own lineups to own collections" ON collection_lineups;
CREATE POLICY "Users can add own lineups to own collections"
  ON collection_lineups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_lineups.collection_id
      AND collections.user_id = (select auth.uid())
    )
    AND
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = collection_lineups.lineup_id
      AND lineups.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own collection lineups" ON collection_lineups;
CREATE POLICY "Users can update own collection lineups"
  ON collection_lineups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_lineups.collection_id
      AND collections.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can remove lineups from own collections" ON collection_lineups;
CREATE POLICY "Users can remove lineups from own collections"
  ON collection_lineups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_lineups.collection_id
      AND collections.user_id = (select auth.uid())
    )
  );

-- ============================================
-- collection_subscriptions table
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can subscribe to collections" ON collection_subscriptions;
CREATE POLICY "Authenticated users can subscribe to collections"
  ON collection_subscriptions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unsubscribe from collections" ON collection_subscriptions;
CREATE POLICY "Users can unsubscribe from collections"
  ON collection_subscriptions FOR DELETE
  USING ((select auth.uid()) = user_id);
