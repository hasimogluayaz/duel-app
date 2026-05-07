/**
 * Returns Supabase clients typed as `any` for use in API routes.
 * This avoids TypeScript `never` errors before actual Supabase types are generated.
 * Replace with proper generated types (supabase gen types typescript) for production.
 */
import { createClient as _createServerClient } from './server'
import { createServiceClient as _createServiceClient } from './server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createApiClient(): any {
  return _createServerClient()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): any {
  return _createServiceClient()
}
