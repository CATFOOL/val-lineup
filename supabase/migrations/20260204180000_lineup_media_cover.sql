-- Add is_cover column to lineup_media for designating a primary/cover media item
ALTER TABLE lineup_media ADD COLUMN is_cover BOOLEAN DEFAULT false;
