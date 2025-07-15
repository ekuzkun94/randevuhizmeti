import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/public',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
  // RBAC örneği: /dashboard/admin sadece admin ve üstü
  if (pathname.startsWith('/dashboard/admin') && !['ADMIN', 'SUPER_ADMIN'].includes(token.role)) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/api/:path*'],
} 