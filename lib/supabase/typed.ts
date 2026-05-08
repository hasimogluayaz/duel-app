/**
 * Supabase client wrappers for API routes.
 *
 * NOTE: The hand-crafted Database type from @/types is preserved for documentation
 * and future use. To fully activate typed queries, generate types via:
 *   npx supabase gen types typescript --project-id <id> > types/supabase.ts
 * Then pass the generated type to createServerClient<Database>(...) in server.ts.
 *
 * Until then, clients return `any` so that all table operations work without casts.
 * The underlying Supabase client IS correctly configured with the right credentials
 * and cookie handling — only TypeScript generics are relaxed.
 */
import { createClient as _createServerClient, createServiceClient as _createServiceClient } from './server'
import type { Database } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Preserved for future use when generated types are available
export type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Creates a Supabase client for API routes.
 * Inherits the user's session cookie → RLS policies apply automatically.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createApiClient(): any {
  return _createServerClient()
}

/**
 * Creates a service-role Supabase client.
 * Bypasses RLS — use only in trusted server contexts (admin, cron, webhooks).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): any {
  return _createServiceClient()
}
