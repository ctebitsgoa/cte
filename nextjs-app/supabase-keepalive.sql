-- ============================================================
-- Keepalive Table for Supabase Free Tier
-- ============================================================
-- This table is used by a Vercel cron job to keep Supabase active
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS keepalive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid_a UUID NOT NULL DEFAULT gen_random_uuid(),
  uuid_b UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keep only the last 100 entries to avoid table bloat
CREATE OR REPLACE FUNCTION cleanup_keepalive()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM keepalive
  WHERE id NOT IN (
    SELECT id FROM keepalive
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS keepalive_cleanup_trigger ON keepalive;
CREATE TRIGGER keepalive_cleanup_trigger
  AFTER INSERT ON keepalive
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_keepalive();

-- No RLS needed - this is just for internal cron use
