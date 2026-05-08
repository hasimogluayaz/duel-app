import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { ApiError, Errors } from './errors'

export interface AuthContext {
  userId: string
}

/**
 * Extracts and validates the authenticated user from the request.
 * Returns the user ID if authenticated, or a 401 NextResponse otherwise.
 *
 * Usage in route handlers:
 *   const auth = await requireAuth()
 *   if (auth instanceof NextResponse) return auth
 *   const { userId } = auth
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  try {
    const supabase = createApiClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim.', code: 'UNAUTHORIZED' },
        { status: 401 },
      )
    }

    return { userId: user.id }
  } catch {
    return NextResponse.json(
      { error: 'Kimlik doğrulama hatası.', code: 'AUTH_ERROR' },
      { status: 401 },
    )
  }
}

/**
 * Checks if the result from requireAuth is an error response.
 * Use as a type guard: if (isAuthError(auth)) return auth
 */
export function isAuthError(
  result: AuthContext | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse
}

/**
 * Checks if the authenticated user is an admin.
 * Throws ApiError(403) if not.
 */
export async function requireAdmin(userId: string): Promise<void> {
  const supabase = createApiClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!profile || !(profile as { is_admin: boolean }).is_admin) {
    throw new ApiError('Bu işlem için admin yetkisi gereklidir.', 403, 'FORBIDDEN')
  }
}

/**
 * Wraps a route handler with automatic auth checking.
 * Handler receives the authenticated userId directly.
 *
 * Usage:
 *   export const POST = withAuth(async (req, { userId }) => { ... })
 */
type OptionalAuthHandler = (
  req: Request,
  ctx: { userId: string | null; params?: Record<string, string> },
) => Promise<NextResponse>

export function optionalAuth(handler: OptionalAuthHandler) {
  return async (req: Request, routeCtx?: { params?: Record<string, string> }) => {
    try {
      const supabase = createApiClient()
      const { data: { user } } = await supabase.auth.getUser()
      return await handler(req, { userId: user?.id ?? null, params: routeCtx?.params })
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
      }
      console.error(`[API ${req.method} ${new URL(req.url).pathname}]`, error)
      return NextResponse.json({ error: 'Sunucu hatası.', code: 'SERVER_ERROR' }, { status: 500 })
    }
  }
}

type AuthedHandler = (
  req: Request,
  ctx: { userId: string; params?: Record<string, string> },
) => Promise<NextResponse>

export function withAuth(handler: AuthedHandler) {
  return async (req: Request, routeCtx?: { params?: Record<string, string> }) => {
    try {
      const supabase = createApiClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.json(
          { error: 'Yetkisiz erişim.', code: 'UNAUTHORIZED' },
          { status: 401 },
        )
      }

      return await handler(req, { userId: user.id, params: routeCtx?.params })
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.status },
        )
      }
      console.error(`[API Auth ${req.method} ${new URL(req.url).pathname}]`, error)
      return NextResponse.json(
        { error: 'Sunucu hatası.', code: 'SERVER_ERROR' },
        { status: 500 },
      )
    }
  }
}
