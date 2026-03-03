import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use Cloudflare Worker proxy URL if available (bypasses network blocks).
  // Falls back to the direct Supabase URL if no proxy is configured.
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL!

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
