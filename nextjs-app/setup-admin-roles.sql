-- ============================================================
-- ADMIN ROLE CONFIGURATION
-- ============================================================
-- Run this in Supabase SQL Editor to configure admin roles
-- Only these two emails will have admin access:
-- 1. ic.cte@goa.bits-pilani.ac.in
-- 2. f20230249@goa.bits-pilani.ac.in
-- ============================================================

-- Step 1: Reset ALL users to student role
UPDATE users SET role = 'student';

-- Step 2: Set the two admin accounts
UPDATE users SET role = 'admin' WHERE email IN (
  'ic.cte@goa.bits-pilani.ac.in',
  'f20230249@goa.bits-pilani.ac.in'
);

-- Step 3: Create or replace function to auto-assign role on user creation
CREATE OR REPLACE FUNCTION set_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Set admin role for specific emails, otherwise student
  IF NEW.email IN ('ic.cte@goa.bits-pilani.ac.in', 'f20230249@goa.bits-pilani.ac.in') THEN
    NEW.role := 'admin';
  ELSE
    NEW.role := 'student';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create triggers
-- On INSERT: auto-set role
DROP TRIGGER IF EXISTS set_user_role_on_insert ON users;
CREATE TRIGGER set_user_role_on_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_role();

-- On UPDATE: prevent role changes (always resets to correct role)
DROP TRIGGER IF EXISTS set_user_role_on_update ON users;
CREATE TRIGGER set_user_role_on_update
  BEFORE UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_role();

-- Step 5: Verify the setup
SELECT id, email, role FROM users ORDER BY role DESC, email;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- After running, you should see:
-- - ic.cte@goa.bits-pilani.ac.in -> admin
-- - f20230249@goa.bits-pilani.ac.in -> admin  
-- - All other users -> student
-- ============================================================
