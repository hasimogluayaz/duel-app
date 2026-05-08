import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Read env vars directly (avoid circular dependency with lib/env.ts)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (typeof window === 'undefined' && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { cookies: getCookieHandlers() },
  )
}

/**
 * Service-role client — bypasses RLS.
 * Never use in code paths accessible to regular users.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): any {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('[Supabase] Missing SUPABASE_SERVICE_ROLE_KEY for service client')
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
