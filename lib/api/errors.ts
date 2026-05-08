import { NextResponse } from 'next/server'

/**
 * Standard API error class.
 * Throw this inside withAuth / withHandler to produce structured responses.
 */
export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number = 400,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Common pre-built errors ───────────────────────────────────────────────
export const Errors = {
  unauthorized: () => new ApiError('Yetkisiz erişim.', 401, 'UNAUTHORIZED'),
  forbidden: () => new ApiError('Bu işlem için yetkiniz yok.', 403, 'FORBIDDEN'),
  notFound: (what = 'Kayıt') => new ApiError(`${what} bulunamadı.`, 404, 'NOT_FOUND'),
  conflict: (msg = 'Bu kayıt zaten mevcut.') => new ApiError(msg, 409, 'CONFLICT'),
  rateLimit: (msg = 'Çok fazla istek. Lütfen bekleyin.') => new ApiError(msg, 429, 'RATE_LIMIT'),
  badRequest: (msg = 'Geçersiz istek.') => new ApiError(msg, 400, 'BAD_REQUEST'),
  server: (msg = 'Sunucu hatası.') => new ApiError(msg, 500, 'SERVER_ERROR'),
} as const

// ── Response helpers ──────────────────────────────────────────────────────
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function err(error: ApiError | Error | string, statusOverride?: number): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: statusOverride ?? error.status },
    )
  }
  const message = typeof error === 'string' ? error : 'Sunucu hatası.'
  return NextResponse.json(
    { error: message, code: 'SERVER_ERROR' },
    { status: statusOverride ?? 500 },
  )
}

// ── Route wrapper with automatic error handling ───────────────────────────
type RouteContext = { params?: Record<string, string> }
type RouteHandler = (req: Request, ctx: RouteContext) => Promise<NextResponse>

export function withHandler(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx: RouteContext) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof ApiError) {
        return err(error)
      }
      // Unexpected error — log with context
      console.error(`[API ${req.method} ${new URL(req.url).pathname}]`, error)
      return err(Errors.server())
    }
  }
}
