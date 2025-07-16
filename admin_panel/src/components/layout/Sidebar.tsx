'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  Bell,
  Key,
  FileText,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  History,
  Package,
  CheckSquare,
  Clock,
  Store,
  Tag,
  Database,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSession, signOut } from 'next-auth/react'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Kullanıcılar',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'Roller',
    href: '/dashboard/roles',
    icon: Shield,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Bildirimler',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    title: 'API Anahtarları',
    href: '/dashboard/api-keys',
    icon: Key,
  },
  {
    title: 'Dosya Yönetimi',
    href: '/dashboard/files',
    icon: FileText,
  },
  {
    title: 'Log Yönetimi',
    href: '/dashboard/logs',
    icon: Activity,
  },
  {
    title: 'Audit Trail',
    href: '/dashboard/audit',
    icon: History,
  },
  {
    title: 'Versiyon Yönetimi',
    href: '/dashboard/versions',
    icon: History,
  },
  {
    title: 'Modül Yönetimi',
    href: '/dashboard/modules',
    icon: Package,
  },
  {
    title: 'Onay İş Akışları',
    href: '/dashboard/workflows',
    icon: CheckSquare,
  },
  {
    title: 'Zamanlayıcı',
    href: '/dashboard/scheduler',
    icon: Clock,
  },
  {
    title: 'Entegrasyon Pazaryeri',
    href: '/dashboard/marketplace',
    icon: Store,
  },
  {
    title: 'ERP Entegrasyonları',
    href: '/dashboard/erp',
    icon: Database,
  },
  {
    title: 'Görev Yönetimi',
    href: '/dashboard/tasks',
    icon: CheckSquare,
  },
  {
    title: 'Faturalandırma',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    title: 'Özel Alanlar',
    href: '/dashboard/custom-fields',
    icon: Settings,
  },
  {
    title: 'SSO / OAuth2',
    href: '/dashboard/sso',
    icon: Shield,
  },
  {
    title: 'Notlar & Etiketler',
    href: '/dashboard/annotations',
    icon: Tag,
  },
  {
    title: 'Ayarlar',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <motion.div
      initial={{ width: collapsed ? 80 : 280 }}
      animate={{ width: collapsed ? 80 : 280 }}
      className="h-screen bg-white border-r border-gray-200 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-lg">Admin Panel</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.name || 'Kullanıcı'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Çıkış Yap</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center space-y-2"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-8 w-8 p-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
} 