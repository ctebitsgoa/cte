-- ============================================================
-- AUTOMATIC USER CREATION TRIGGER
-- ============================================================
-- This creates a user record automatically when someone signs in
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- Create a function that inserts into public.users when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists (so we can recreate it)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CREATE YOUR USER NOW (since trigger wasn't there before)
-- ============================================================
-- This inserts your existing auth user into the users table

INSERT INTO public.users (id, email, name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'admin'  -- Making you an admin
FROM auth.users
WHERE email LIKE '%f20230621%' OR email LIKE '%goa.pilani%'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- If the above doesn't find you, this will insert ALL auth users:
INSERT INTO public.users (id, email, name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'student'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Now make you specifically an admin
UPDATE public.users SET role = 'admin' 
WHERE email LIKE '%f20230621%' OR email LIKE '%goa.pilani%';

-- ============================================================
-- VERIFY
-- ============================================================
SELECT id, email, name, role FROM public.users;
