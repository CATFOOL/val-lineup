-- 创建 storage bucket 用于存储 lineup 媒体文件
INSERT INTO storage.buckets (id, name, public)
VALUES ('lineup-media', 'lineup-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 策略: 允许认证用户上传
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lineup-media'
    AND auth.role() = 'authenticated'
  );

-- Storage 策略: 公开读取
CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lineup-media');

-- Storage 策略: 用户可以删除自己上传的文件
CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lineup-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
