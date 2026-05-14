import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = ['/profil/ayarlar', '/bildirimler', '/mesajlar', '/admin']
const authRoutes = ['/giris', '/kayit']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  const isProfileCompletion = pathname.startsWith('/auth/tamamla')

  // Logged-in user with incomplete Google profile → force them to /auth/tamamla
  // profile_complete is stored in user_metadata to avoid extra DB calls
  if (user && !isProfileCompletion) {
    const profileComplete = user.user_metadata?.profile_complete !== false
    if (!profileComplete) {
      return NextResponse.redirect(new URL('/auth/tamamla', request.url))
    }
  }

  if (isProtected && !user) {
    const redirectUrl = new URL('/giris', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/oyun', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
