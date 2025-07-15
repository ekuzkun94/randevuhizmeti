import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getSessionUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

export async function requireRole(roles: string[] | string) {
  const user = await getSessionUser()
  if (!user) return false
  const allowed = Array.isArray(roles) ? roles : [roles]
  return allowed.includes(user.role)
}

export function hasPermission(user: any, permission: string) {
  // Geliştirilebilir: Kullanıcıya özel izin kontrolü
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true
  // ...
  return false
} 