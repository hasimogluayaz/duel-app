/**
 * Centralized environment variable validation.
 * Import this module wherever env vars are needed.
 * Fails fast at module load time (server-side) with clear error messages.
 */

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value && typeof window === 'undefined') {
    // In production we log but don't throw to avoid crashing the whole server
    // In development throw immediately for fast feedback
    const msg = `[ENV] Missing required environment variable: ${key}`
    if (process.env.NODE_ENV === 'development') {
      throw new Error(msg)
    }
    console.error(msg)
    return ''
  }
  return value ?? ''
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

export const env = {
  // Supabase — public (safe to expose to client)
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),

  // Supabase — server-only
  supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // AI providers
  groqApiKey: requireEnv('GROQ_API_KEY'),

  // App
  appUrl: requireEnv('NEXT_PUBLIC_APP_URL'),
  cronSecret: requireEnv('CRON_SECRET'),

  // Optional
  anthropicApiKey: optionalEnv('ANTHROPIC_API_KEY'),

  // Runtime
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const
