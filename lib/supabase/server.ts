import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getCookieHandlers() {
  const cookieStore = cookies()
  return {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      try { cookieStore.set({ name, value, ...options }) } catch { /* ignored in server components */ }
    },
    remove(name: string, options: Record<string, unknown>) {
      try { cookieStore.set({ name, value: '', ...options }) } catch { /* ignored */ }
    },
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { cookies: getCookieHandlers() }
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): any {
  // Use direct supabase-js client (not SSR) so service role key
  // is never overridden by session cookies — auth.role() = 'service_role'
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
