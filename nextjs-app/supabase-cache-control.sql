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
-- Verifying — and a finding worth knowing
-- ============================================================
--   curl -sI "<public_url>" | grep -i cache-control
--
-- On this project that currently returns `cache-control: no-cache` no matter
-- what the metadata says. That was checked properly: objects were re-uploaded
-- through the Storage API with cacheControl 31536000, their bytes and ETags
-- changed, the CDN picked up the new content — and the served header was still
-- `no-cache`, on both buckets, including a freshly written object.
--
-- Every response also carries `sb-gateway-mode: direct`, so the header is being
-- applied at Supabase's edge rather than coming from the object. It is not
-- something the upload options or this UPDATE can change; it is a question for
-- Supabase support / the project's plan settings.
--
-- Keep this script anyway: the stored metadata is now correct, so the intended
-- header applies the moment that gateway behaviour changes.
--
-- The practical mitigation is size, not caching, and that part is done:
-- scripts/optimize-storage-images.mjs cut these covers from 40.7 MB to 15.8 MB.
-- Once the next/image changes are deployed, visitors stop fetching these
-- originals altogether — the optimizer pulls each one once and serves resized
-- copies with its own year-long cache.
-- ============================================================
