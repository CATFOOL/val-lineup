-- 修复 handle_new_user 触发器：清理 Discord/Google 等 OAuth 用户名中的特殊字符
-- Discord 的 "catfool#0" -> "catfool"（去掉 # discriminator）
-- 其他特殊字符也会被清理，只保留字母、数字、下划线、连字符
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_name TEXT;
  clean_name TEXT;
BEGIN
  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  -- 先截掉 # 及后面的内容（Discord discriminator，如 catfool#0 -> catfool）
  clean_name := split_part(raw_name, '#', 1);
  -- 再去掉其余特殊字符，只保留字母、数字、下划线、连字符
  clean_name := regexp_replace(clean_name, '[^a-zA-Z0-9_\-]', '', 'g');
  -- 如果清理后为空，用随机名
  IF clean_name = '' THEN
    clean_name := 'user_' || substr(gen_random_uuid()::text, 1, 8);
  END IF;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, clean_name);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 插入失败（如 username 重复），加随机后缀
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    clean_name || '_' || substr(gen_random_uuid()::text, 1, 8)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
