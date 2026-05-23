import { NextResponse } from 'next/server'

// Anonymous answers are disabled platform-wide. Keep this stub so any cached
// clients / service workers get a clean 410 instead of a 404 + silent fail.
export async function POST() {
  return NextResponse.json(
    {
      error: 'Anonim cevap kapalı. Lütfen giriş yap veya hesap oluştur.',
      code: 'ANONYMOUS_DISABLED',
    },
    { status: 410 },
  )
}
