-- Create storage bucket for collection cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('collection-covers', 'collection-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload covers
CREATE POLICY "Authenticated users can upload collection covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'collection-covers'
    AND auth.role() = 'authenticated'
  );

-- Storage policy: public can view covers
CREATE POLICY "Public can view collection covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'collection-covers');

-- Storage policy: users can delete own covers
CREATE POLICY "Users can delete own collection covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'collection-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
