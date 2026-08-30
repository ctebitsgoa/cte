-- ============================================================
-- Raise Cache-Control on EXISTING Storage objects
-- ============================================================
-- New uploads get a 1-year max-age from the app (lib/utils.ts
-- UPLOAD_CACHE_CONTROL). Files uploaded BEFORE that change still carry the old
-- "max-age=3600", so returning visitors keep re-downloading them every hour —
-- which is what the cached egress bill is made of.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- 1. See what you have now (expect mostly max-age=3600)
SELECT
  bucket_id,
  metadata->>'cacheControl' AS cache_control,
  count(*) AS objects,
  pg_size_pretty(sum((metadata->>'size')::bigint)) AS total_size
FROM storage.objects
WHERE bucket_id IN ('uploads', 'course-images')
GROUP BY 1, 2
ORDER BY 1, 2;

-- 2. Bump every existing object to 1 year
UPDATE storage.objects
SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{cacheControl}', '"max-age=31536000"')
WHERE bucket_id IN ('uploads', 'course-images')
  AND coalesce(metadata->>'cacheControl', '') <> 'max-age=31536000';

-- 3. Confirm the change landed
SELECT
  bucket_id,
  metadata->>'cacheControl' AS cache_control,
  count(*) AS objects
FROM storage.objects
WHERE bucket_id IN ('uploads', 'course-images')
GROUP BY 1, 2
ORDER BY 1, 2;

-- 4. Grab public URLs to test against from your terminal.
--    Put YOUR project ref on the line marked below (Dashboard -> Settings ->
--    API -> Project URL, the bit before ".supabase.co").
WITH cfg AS (SELECT 'your-project-ref' AS ref)   -- <<< EDIT THIS LINE
SELECT
  'https://' || cfg.ref || '.supabase.co/storage/v1/object/public/'
    || o.bucket_id || '/' || o.name AS public_url,
  pg_size_pretty((o.metadata->>'size')::bigint) AS size
FROM storage.objects o, cfg
WHERE o.bucket_id = 'course-images'
ORDER BY (o.metadata->>'size')::bigint DESC
LIMIT 5;

-- ============================================================
-- Verifying — and what to expect
-- ============================================================
--   curl -sI "<public_url>" | grep -i cache-control
--
-- IMPORTANT: this UPDATE fixes the metadata in the database, but the header
-- users actually receive will NOT change right away. The object's bytes are
-- untouched, so its ETag is unchanged, and the CDN goes on serving the
-- response headers it already had (you'll see `cf-cache-status: REVALIDATED`).
--
-- The new header takes effect the next time the object is *written*. So to
-- push it through, re-upload the file — through the admin UI is easiest, and
-- that also runs it through the downscaler in lib/image.ts and changes the
-- URL via the ?v= buster, which fixes the size and the CDN entry in one go.
--
-- This matters much less once the next/image changes are deployed: visitors
-- then receive resized copies from the image optimizer (cached a year) and
-- stop pulling these originals from Storage at all.
-- ============================================================
