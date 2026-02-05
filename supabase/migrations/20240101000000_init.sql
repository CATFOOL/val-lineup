-- 创建 profiles 表 (用户资料, 扩展 auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 lineups 表 (主要的 lineup 数据)
-- agent_uuid 和 map_uuid 存储 Valorant API 的 UUID
CREATE TABLE lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  agent_uuid VARCHAR(100) NOT NULL, -- Valorant API agent UUID
  map_uuid VARCHAR(100) NOT NULL, -- Valorant API map UUID
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ability VARCHAR(50), -- Ability1, Ability2, Grenade, Ultimate (optional)
  side VARCHAR(10), -- attack, defense (optional)
  site VARCHAR(20), -- A, B, C, Mid, etc.
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 lineup_media 表 (lineup 的图片/视频)
CREATE TABLE lineup_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  media_type VARCHAR(10) NOT NULL, -- image, video
  url TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 lineup_likes 表 (点赞)
CREATE TABLE lineup_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lineup_id, user_id)
);

-- 创建索引
CREATE INDEX idx_lineups_agent ON lineups(agent_uuid);
CREATE INDEX idx_lineups_map ON lineups(map_uuid);
CREATE INDEX idx_lineups_user ON lineups(user_id);
CREATE INDEX idx_lineups_published ON lineups(is_published) WHERE is_published = true;
CREATE INDEX idx_lineup_media_lineup ON lineup_media(lineup_id);

-- 启用 RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_likes ENABLE ROW LEVEL SECURITY;

-- Profiles 策略
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Lineups 策略
CREATE POLICY "Published lineups are viewable by everyone"
  ON lineups FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create lineups"
  ON lineups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lineups"
  ON lineups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lineups"
  ON lineups FOR DELETE
  USING (auth.uid() = user_id);

-- Lineup Media 策略
CREATE POLICY "Media viewable if lineup is viewable"
  ON lineup_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = lineup_media.lineup_id
      AND (lineups.is_published = true OR lineups.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add media to own lineups"
  ON lineup_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = lineup_media.lineup_id
      AND lineups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update media on own lineups"
  ON lineup_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = lineup_media.lineup_id
      AND lineups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media from own lineups"
  ON lineup_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lineups
      WHERE lineups.id = lineup_media.lineup_id
      AND lineups.user_id = auth.uid()
    )
  );

-- Likes 策略
CREATE POLICY "Likes are viewable by everyone"
  ON lineup_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON lineup_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
  ON lineup_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 创建触发器: 新用户自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 如果插入失败（如 username 重复），使用 email 前缀 + 随机后缀
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1) || '_' || substr(gen_random_uuid()::text, 1, 8)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
