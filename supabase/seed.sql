-- Seed file for test users
-- These users will be recreated after every `supabase db reset`

-- Test user: 123@gmail.com / 123456
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  recovery_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'authenticated',
  'authenticated',
  '123@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false
) ON CONFLICT (id) DO NOTHING;

-- Identity record (required for email login)
INSERT INTO auth.identities (
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'email',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "email": "123@gmail.com", "email_verified": true, "phone_verified": false}',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- Profile record
INSERT INTO public.profiles (id, username)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '123'
) ON CONFLICT (id) DO NOTHING;
