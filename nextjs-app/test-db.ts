import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Direct test without auth - uses service role to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function runTests() {
  console.log('\n========================================')
  console.log('🧪 SUPABASE API TEST SCRIPT')
  console.log('========================================\n')

  // Test 1: Check environment variables
  console.log('1️⃣ Checking environment variables...')
  console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('   SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ Missing environment variables. Add SUPABASE_SERVICE_ROLE_KEY to .env.local')
    console.log('   Get it from: Supabase Dashboard > Settings > API > service_role key')
    return
  }

  // Create admin client (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })

  // Test 2: List all tables
  console.log('\n2️⃣ Testing database connection...')
  try {
    const { data: courses, error } = await supabase.from('courses').select('id, name').limit(1)
    if (error) throw error
    console.log('   ✅ Database connection works')
    console.log('   Sample course:', courses?.[0]?.name || 'No courses')
  } catch (e) {
    console.log('   ❌ Database error:', (e as Error).message)
  }

  // Test 3: Check users table
  console.log('\n3️⃣ Checking users table...')
  try {
    const { data: users, error, count } = await supabase
      .from('users')
      .select('id, email, role', { count: 'exact' })
    
    if (error) throw error
    console.log(`   ✅ Users table has ${count} users`)
    users?.forEach(u => {
      console.log(`      - ${u.email} (${u.role})`)
    })
  } catch (e) {
    console.log('   ❌ Error:', (e as Error).message)
  }

  // Test 4: Check auth.users table
  console.log('\n4️⃣ Checking auth.users (Supabase Auth)...')
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    console.log(`   ✅ Auth has ${data.users.length} users`)
    data.users.forEach(u => {
      console.log(`      - ${u.email} (ID: ${u.id.slice(0, 8)}...)`)
    })
  } catch (e) {
    console.log('   ❌ Error:', (e as Error).message)
  }

  // Test 5: Check if auth users exist in public.users
  console.log('\n5️⃣ Checking if auth users are synced to public.users...')
  try {
    const { data: authData } = await supabase.auth.admin.listUsers()
    const { data: dbUsers } = await supabase.from('users').select('id, email')
    
    const authIds = new Set(authData?.users.map(u => u.id) || [])
    const dbIds = new Set(dbUsers?.map(u => u.id) || [])
    
    const missingInDb = authData?.users.filter(u => !dbIds.has(u.id)) || []
    
    if (missingInDb.length > 0) {
      console.log(`   ⚠️ ${missingInDb.length} auth users NOT in public.users:`)
      missingInDb.forEach(u => {
        console.log(`      - ${u.email} (ID: ${u.id})`)
      })
      console.log('\n   🔧 Auto-creating missing users...')
      
      for (const user of missingInDb) {
        const { error } = await supabase.from('users').insert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'admin' // Making first user admin
        })
        if (error) {
          console.log(`      ❌ Failed to create ${user.email}: ${error.message}`)
        } else {
          console.log(`      ✅ Created ${user.email} as admin`)
        }
      }
    } else {
      console.log('   ✅ All auth users are synced to public.users')
    }
  } catch (e) {
    console.log('   ❌ Error:', (e as Error).message)
  }

  // Test 6: Verify final state
  console.log('\n6️⃣ Final verification...')
  try {
    const { data: users } = await supabase.from('users').select('id, email, role')
    console.log('   Users in database:')
    users?.forEach(u => {
      const roleIcon = u.role === 'admin' ? '👑' : '👤'
      console.log(`      ${roleIcon} ${u.email} (${u.role})`)
    })
  } catch (e) {
    console.log('   ❌ Error:', (e as Error).message)
  }

  console.log('\n========================================')
  console.log('✅ Tests complete! Refresh your app.')
  console.log('========================================\n')
}

runTests()
