/**
 * Full logical backup of the Supabase project over the REST/admin APIs — no
 * database password needed, just the service role key.
 *
 * Run this while the project is still reachable. If the org gets restricted
 * under the Fair Use Policy the APIs return 402, and taking a backup then is
 * no longer possible.
 *
 * Output contains student PII (emails, phone numbers, BITS IDs), so it is
 * written OUTSIDE the repo and must not be committed.
 *
 *   node scripts/backup-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

config({ path: '.env.local', quiet: true })

const TABLES = [
  'users', 'courses', 'course_instructors', 'course_pages', 'user_courses',
  'questions', 'quiz_questions', 'quiz_attempts', 'team_members',
  'team_settings', 'uploads', 'keepalive',
]
const BUCKETS = ['course-images', 'uploads']

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
const outDir = process.env.BACKUP_OUT || path.join(os.homedir(), `noodle-supabase-backup-${stamp}`)
fs.mkdirSync(outDir, { recursive: true })

const supabase = createClient(url, key, { auth: { persistSession: false } })
const write = (name, data) =>
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2))

console.log(`Backing up to ${outDir}\n`)
let failures = 0

for (const table of TABLES) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) {
    console.log(`  FAIL  ${table.padEnd(20)} ${error.message}`)
    failures++
    continue
  }
  write(`${table}.json`, data)
  console.log(`   OK   ${table.padEnd(20)} ${String(data.length).padStart(5)} rows`)
}

// auth.users — needed to preserve UIDs, which public.users.id and
// user_courses.user_id both reference.
const authUsers = []
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) {
    console.log(`  FAIL  auth.users           ${error.message}`)
    failures++
    break
  }
  authUsers.push(...data.users)
  if (data.users.length < 1000) break
}
if (authUsers.length) {
  write('auth_users.json', authUsers)
  console.log(`   OK   ${'auth.users'.padEnd(20)} ${String(authUsers.length).padStart(5)} users`)
}

// Storage inventory (paths + metadata, not the bytes themselves)
const inventory = {}
for (const bucket of BUCKETS) {
  const walk = async (prefix = '') => {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
    if (error || !data) return []
    const out = []
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.metadata?.size == null) out.push(...(await walk(full)))
      else out.push({ path: full, size: entry.metadata.size, mimetype: entry.metadata.mimetype })
    }
    return out
  }
  inventory[bucket] = await walk()
  const bytes = inventory[bucket].reduce((n, o) => n + o.size, 0)
  console.log(`   OK   ${`storage/${bucket}`.padEnd(20)} ${String(inventory[bucket].length).padStart(5)} objects, ${(bytes / 1048576).toFixed(1)} MB`)
}
write('storage_inventory.json', inventory)

console.log(`\n${failures ? `${failures} failure(s). ` : ''}Backup written to:\n  ${outDir}`)
console.log('Contains student PII — keep it out of git and off shared drives.')
