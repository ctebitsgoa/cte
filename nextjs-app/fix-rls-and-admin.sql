-- ============================================================
-- FIX RLS POLICIES AND SET ADMIN
-- ============================================================
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Fix RLS policies for users table
-- ============================================================

-- Drop all existing user policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view own data or admins can view all" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can update own or admins all" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;

-- Allow users to view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own record (for first login)
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- STEP 2: Check your current user
-- ============================================================
-- This shows all users in the database
SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;

-- ============================================================
-- STEP 3: Make yourself an admin
-- ============================================================
-- METHOD A: Update by email (replace with your actual email from Step 2)
UPDATE users SET role = 'admin' WHERE email = 'f20230621@goa.pilani.ac.in';

-- METHOD B: If your email looks different, try a pattern match
UPDATE users SET role = 'admin' WHERE email LIKE '%f20230621%';

-- METHOD C: Update by your Supabase Auth ID
-- First, find your auth ID by going to Supabase Dashboard > Authentication > Users
-- Then run:
-- UPDATE users SET role = 'admin' WHERE id = 'your-auth-uuid-here';

-- ============================================================
-- STEP 4: Verify the update worked
-- ============================================================
SELECT id, email, role FROM users WHERE role = 'admin';

-- ============================================================
-- ALTERNATIVE: Bypass RLS temporarily to check data
-- ============================================================
-- If you're having trouble, you can temporarily disable RLS (for testing only!)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- SELECT * FROM users;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
