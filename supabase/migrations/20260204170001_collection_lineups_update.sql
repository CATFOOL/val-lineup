-- Add missing UPDATE policy for collection_lineups (needed for drag-to-reorder sort_order)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'collection_lineups'
    AND policyname = 'Users can update own collection lineups'
  ) THEN
    CREATE POLICY "Users can update own collection lineups"
      ON collection_lineups FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM collections
          WHERE collections.id = collection_lineups.collection_id
          AND collections.user_id = auth.uid()
        )
      );
  END IF;
END
$$;
