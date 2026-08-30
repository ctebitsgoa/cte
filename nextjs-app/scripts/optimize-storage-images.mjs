/**
 * One-off maintenance: shrink oversized images already sitting in Supabase
 * Storage and rewrite them with a long Cache-Control.
 *
 * Re-uploading (rather than editing metadata in SQL) is what actually makes the
 * new header reach users: it changes the object's bytes, so the CDN drops its
 * stale entry instead of serving the headers it cached alongside the old ETag.
 *
 * Every original is downloaded to a local backup folder BEFORE it is
 * overwritten, so any file can be put back by hand if a result looks wrong.
 *
 * Requires macOS (uses the built-in `sips`) and SUPABASE_SERVICE_ROLE_KEY.
 *
 *   node scripts/optimize-storage-images.mjs --dry-run
 *   node scripts/optimize-storage-images.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { config } from 'dotenv'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

config({ path: '.env.local', quiet: true })

const BUCKET = 'course-images'
const PREFIX = 'courses'
const MAX_DIMENSION = 1600
const MIN_SIZE = 500 * 1024 // leave anything already small alone
const CACHE_CONTROL = '31536000'

const DRY_RUN = process.argv.includes('--dry-run')
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(os.tmpdir(), 'storage-image-backup')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
const kb = n => `${(n / 1024).toFixed(0).padStart(7)} KB`

const { data: objects, error } = await supabase.storage
  .from(BUCKET)
  .list(PREFIX, { limit: 1000 })
if (error) {
  console.error('List failed:', error.message)
  process.exit(1)
}

const targets = (objects || [])
  .filter(o => (o.metadata?.size ?? 0) > MIN_SIZE)
  .sort((a, b) => b.metadata.size - a.metadata.size)

console.log(`${DRY_RUN ? 'DRY RUN — ' : ''}${targets.length} of ${objects.length} objects above ${MIN_SIZE / 1024}KB in ${BUCKET}/${PREFIX}`)
console.log(`Backups: ${BACKUP_DIR}\n`)
fs.mkdirSync(BACKUP_DIR, { recursive: true })

let before = 0
let after = 0
let rewritten = 0

for (const obj of targets) {
  const remotePath = `${PREFIX}/${obj.name}`
  const originalSize = obj.metadata.size
  before += originalSize

  const { data: blob, error: dlError } = await supabase.storage.from(BUCKET).download(remotePath)
  if (dlError || !blob) {
    console.log(`  SKIP  ${obj.name} — download failed: ${dlError?.message}`)
    after += originalSize
    continue
  }

  const backupPath = path.join(BACKUP_DIR, obj.name)
  fs.writeFileSync(backupPath, Buffer.from(await blob.arrayBuffer()))

  const resizedPath = path.join(BACKUP_DIR, `resized-${obj.name}`)
  try {
    execFileSync('sips', ['-Z', String(MAX_DIMENSION), backupPath, '--out', resizedPath], {
      stdio: 'ignore',
    })
  } catch {
    console.log(`  SKIP  ${obj.name} — sips could not read it`)
    after += originalSize
    continue
  }

  // Anything already within MAX_DIMENSION won't shrink, but it still gets
  // rewritten — that is what replaces the stale `no-cache` header the CDN is
  // holding. Smaller-or-equal wins, so we never make a file bigger.
  const resized = fs.readFileSync(resizedPath)
  const smaller = resized.length < originalSize
  const payload = smaller ? resized : Buffer.from(await (await supabase.storage.from(BUCKET).download(remotePath)).data.arrayBuffer())
  const finalSize = smaller ? resized.length : originalSize

  if (!DRY_RUN) {
    const { error: upError } = await supabase.storage
      .from(BUCKET)
      .upload(remotePath, payload, {
        upsert: true,
        cacheControl: CACHE_CONTROL,
        contentType: obj.metadata.mimetype,
      })
    if (upError) {
      console.log(`  FAIL  ${obj.name} — upload failed: ${upError.message}`)
      after += originalSize
      continue
    }
  }

  rewritten++
  after += finalSize
  const label = smaller ? `${kb(originalSize)} -> ${kb(finalSize)}  (${(originalSize / finalSize).toFixed(1)}x)` : `${kb(originalSize)}  header only`
  console.log(`  ${DRY_RUN ? 'WOULD' : ' DONE'} ${obj.name.padEnd(46)} ${label}`)
}

console.log(`\n${DRY_RUN ? 'Would rewrite' : 'Rewrote'} ${rewritten} object(s)`)
console.log(`Total: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`)
if (DRY_RUN) console.log('\nRe-run without --dry-run to apply.')
