/**
 * Input validation schemas for API routes.
 * Simple hand-rolled validators (no Zod dependency to keep bundle light).
 * Each validator returns the validated & typed value or throws ApiError.
 */
import { ApiError } from './errors'

// ── Primitives ────────────────────────────────────────────────────────────

export function requireString(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number } = {},
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiError(`${field} zorunludur.`, 400, 'VALIDATION')
  }
  const trimmed = value.trim()
  if (opts.min && trimmed.length < opts.min) {
    throw new ApiError(`${field} en az ${opts.min} karakter olmalı.`, 400, 'VALIDATION')
  }
  if (opts.max && trimmed.length > opts.max) {
    throw new ApiError(`${field} en fazla ${opts.max} karakter olabilir.`, 400, 'VALIDATION')
  }
  return trimmed
}

export function requireUuid(value: unknown, field: string): string {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new ApiError(`${field} geçerli bir ID olmalıdır.`, 400, 'VALIDATION')
  }
  return value
}

export function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') return undefined
  return value.trim() || undefined
}

// ── Parsed body helper ────────────────────────────────────────────────────

export async function parseBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const body = await req.json() as T
    if (typeof body !== 'object' || body === null) {
      throw new ApiError('İstek gövdesi geçerli JSON olmalıdır.', 400, 'VALIDATION')
    }
    return body
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError('İstek gövdesi okunamadı.', 400, 'VALIDATION')
  }
}

// ── Domain-specific validators ────────────────────────────────────────────

const BANNED_SUBSTRINGS = [
  'sik', 'orospu', 'amk', 'amına', 'amını', 'hassiktir', 'götveren',
  'ibne', 'kevaşe', 'sürtük', 'pezevenk', 'gavat',
  'fuck', 'shit', 'asshole', 'cunt', 'nigger', 'faggot',
]
const BANNED_WHOLE_WORDS = [
  'göt', 'bok', 'oç', 'piç', 'piçlik', 'kahpe', 'kaltak', 'şerefsiz',
  'bitch', 'bastard', 'dick', 'whore',
]

export function validateEmojiContent(content: string): string {
  if (!content || content.trim().length === 0) {
    throw new ApiError('En az bir emoji gir.', 400, 'VALIDATION')
  }
  const trimmed = content.trim()
  if (trimmed.length > 100) {
    throw new ApiError('Emoji cevabı 100 karakter geçemez.', 400, 'VALIDATION')
  }
  // Reject if any standard Latin letters, digits, or punctuation found
  if (/[a-zA-ZğüşıöçĞÜŞİÖÇ0-9.,!?;:()\-_"'@#$%^&*+=<>/\\[\]{}|`~]/.test(trimmed)) {
    throw new ApiError('Sadece emoji kullanılabilir — harf veya sayı yasak.', 400, 'CONTENT_VIOLATION')
  }
  return trimmed
}

export function validateAnswerContent(content: string): string {
  const trimmed = requireString(content, 'Cevap', { min: 10, max: 280 })
  const lower = trimmed.toLowerCase()

  for (const word of BANNED_SUBSTRINGS) {
    if (lower.includes(word)) {
      throw new ApiError('Cevabınız uygunsuz içerik barındırıyor.', 400, 'CONTENT_VIOLATION')
    }
  }
  for (const word of BANNED_WHOLE_WORDS) {
    const re = new RegExp(`(^|[^a-zA-ZğüşıöçĞÜŞİÖÇ])${word}([^a-zA-ZğüşıöçĞÜŞİÖÇ]|$)`, 'i')
    if (re.test(lower)) {
      throw new ApiError('Cevabınız uygunsuz içerik barındırıyor.', 400, 'CONTENT_VIOLATION')
    }
  }

  return trimmed
}

export function validateUsername(username: string): string {
  const trimmed = requireString(username, 'Kullanıcı adı', { min: 3, max: 20 })
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    throw new ApiError(
      'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.',
      400,
      'VALIDATION',
    )
  }
  return trimmed.toLowerCase()
}
