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
  CreditCard,
  Calendar,
  UserCheck,
  Building,
  FolderOpen,
  FolderClosed,
  Briefcase,
  Zap,
  Globe,
  Lock,
  PieChart,
  Workflow,
  Cog,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSession, signOut } from 'next-auth/react'

interface MenuItem {
  title: string
  href: string
  icon: any
  badge?: string
}

interface MenuGroup {
  title: string
  icon: any
  items: MenuItem[]
  defaultOpen?: boolean
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Ana Sayfa',
    icon: LayoutDashboard,
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
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
    ],
    defaultOpen: true
  },
  {
    title: 'Randevu Yönetimi',
    icon: Calendar,
    items: [
      {
        title: 'Randevular',
        href: '/dashboard/appointments',
        icon: Calendar,
        badge: 'Yeni'
      },
      {
        title: 'Hizmet Sağlayıcıları',
        href: '/dashboard/providers',
        icon: Building,
      },
      {
        title: 'Çalışanlar',
        href: '/dashboard/employees',
        icon: Users,
      },
      {
        title: 'Müşteriler',
        href: '/dashboard/customers',
        icon: UserCheck,
      },
      {
        title: 'Hizmetler',
        href: '/dashboard/services',
        icon: Package,
      },
    ],
    defaultOpen: true
  },
  {
    title: 'Sistem Yönetimi',
    icon: Cog,
    items: [
      {
        title: 'Kullanıcılar',
        href: '/dashboard/users',
        icon: Users,
      },
      {
        title: 'Roller & İzinler',
        href: '/dashboard/roles',
        icon: Shield,
      },
      {
        title: 'API Anahtarları',
        href: '/dashboard/api-keys',
        icon: Key,
      },
      {
        title: 'SSO / OAuth2',
        href: '/dashboard/sso',
        icon: Lock,
      },
    ]
  },
  {
    title: 'İçerik & Dosyalar',
    icon: FileText,
    items: [
      {
        title: 'Dosya Yönetimi',
        href: '/dashboard/files',
        icon: FileText,
      },
      {
        title: 'Notlar & Etiketler',
        href: '/dashboard/annotations',
        icon: Tag,
      },
      {
        title: 'Versiyon Yönetimi',
        href: '/dashboard/versions',
        icon: History,
      },
      {
        title: 'Özel Alanlar',
        href: '/dashboard/custom-fields',
        icon: Palette,
      },
    ]
  },
  {
    title: 'İş Akışları',
    icon: Workflow,
    items: [
      {
        title: 'Görev Yönetimi',
        href: '/dashboard/tasks',
        icon: CheckSquare,
      },
      {
        title: 'Onay İş Akışları',
        href: '/dashboard/workflows',
        icon: Workflow,
      },
      {
        title: 'Zamanlayıcı',
        href: '/dashboard/scheduler',
        icon: Clock,
      },
    ]
  },
  {
    title: 'Entegrasyonlar',
    icon: Zap,
    items: [
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
        title: 'Modül Yönetimi',
        href: '/dashboard/modules',
        icon: Package,
      },
    ]
  },
  {
    title: 'Finans & Raporlama',
    icon: CreditCard,
    items: [
      {
        title: 'Faturalandırma',
        href: '/dashboard/billing',
        icon: CreditCard,
      },
      {
        title: 'Audit Trail',
        href: '/dashboard/audit',
        icon: History,
      },
      {
        title: 'Log Yönetimi',
        href: '/dashboard/logs',
        icon: Activity,
      },
    ]
  },
  {
    title: 'Sistem Ayarları',
    icon: Settings,
    items: [
      {
        title: 'Genel Ayarlar',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ]
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(menuGroups.filter(g => g.defaultOpen).map(g => g.title))
  )
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  const toggleGroup = (groupTitle: string) => {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(groupTitle)) {
      newOpenGroups.delete(groupTitle)
    } else {
      newOpenGroups.add(groupTitle)
    }
    setOpenGroups(newOpenGroups)
  }

  const isGroupOpen = (groupTitle: string) => openGroups.has(groupTitle)

  return (
    <motion.div
      initial={{ width: collapsed ? 80 : 280 }}
      animate={{ width: collapsed ? 80 : 280 }}
      className="h-screen bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuGroups.map((group) => {
          const isOpen = isGroupOpen(group.title)
          const hasActiveItem = group.items.some(item => pathname === item.href)
          
          return (
            <div key={group.title} className="space-y-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.title)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-left',
                  hasActiveItem 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <div className="flex items-center space-x-3">
                  <group.icon className="h-4 w-4 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium"
                      >
                        {group.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      {isOpen ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : (
                        <FolderClosed className="h-4 w-4" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Group Items */}
              <AnimatePresence>
                {isOpen && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-6 space-y-1"
                  >
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link key={item.href} href={item.href}>
                          <motion.div
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group',
                              isActive
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200'
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <item.icon className={cn(
                                'h-4 w-4 flex-shrink-0 transition-colors',
                                isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                              )} />
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>
                            </div>
                            {item.badge && (
                              <span className={cn(
                                'px-2 py-1 text-xs font-medium rounded-full',
                                isActive 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-blue-100 text-blue-700'
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </motion.div>
                        </Link>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed View - Show only active items */}
              {collapsed && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    if (!isActive) return null
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 cursor-pointer mx-auto',
                            isActive
                              ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                          title={item.title}
                        >
                          <item.icon className="h-5 w-5" />
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
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
                className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
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
              className="flex flex-col items-center space-y-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
                title="Çıkış Yap"
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