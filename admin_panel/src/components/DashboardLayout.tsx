'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { logoutUser } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import {
  Menu,
  Home,
  Users,
  Calendar,
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  ChevronLeft
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Kullanıcılar', href: '/dashboard/users', icon: Users },
    { name: 'Randevular', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-[220px] bg-gradient-to-b from-[#1a389c] to-[#274baf] shadow-xl flex flex-col transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0 lg:w-[140px]`}
        style={{ minWidth: 0, maxWidth: 220, width: '100%', cursor: 'default' }}
      >
        {/* Logo */}
        <div className={`flex flex-col items-center justify-center ${sidebarOpen ? 'h-32' : 'h-32'} py-2`}>
          <div className="flex items-center justify-center w-full">
            <Image
              src="/zamanyonet_logo.png"
              alt="Logo"
              width={sidebarOpen ? 80 : 80}
              height={sidebarOpen ? 80 : 80}
              className="object-contain rounded-full bg-white/0"
              priority
            />
          </div>
          {!sidebarOpen && (
            <span className="mt-3 text-xs font-bold text-white tracking-widest whitespace-nowrap text-center">ZAMANYONET</span>
          )}
        </div>
        {/* Navigation */}
        <nav className="mt-8 flex-1">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = router.pathname === item.href
              return (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={`group flex items-center justify-start px-2 py-2 text-xs font-medium rounded-lg transition-colors
                      ${isActive ? 'bg-white/10 border-l-4 border-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-lg' : 'text-blue-100 hover:bg-white/5 hover:text-white'}
                    `}
                    style={isActive ? { borderImage: 'linear-gradient(to right, #ff6a00, #ffb347) 1' } : {}}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="ml-2 text-xs">{item.name}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        {/* Collapse Button - Sadece geniş modda, sidebar'ın en altına sabit ve ortalanmış */}
        {sidebarOpen && (
          <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center pb-2 z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-center p-2 rounded-full text-blue-200 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 shadow"
              aria-label="Menüyü daralt"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
        )}
      </aside>
      {/* Main content */}
      <div className="flex-1 transition-all duration-300 w-full"> 
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur shadow-sm border-b border-gray-200 flex items-center h-16 px-3 sm:px-6 lg:px-8 justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Hamburger menu for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-blue-700 hover:text-blue-900 bg-white/60 mr-2"
              aria-label="Menüyü aç"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="max-w-lg lg:max-w-xs w-full">
              <label htmlFor="search" className="sr-only">Ara</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <input
                  id="search"
                  type="text"
                  placeholder="Ara..."
                  className="block w-full pl-9 pr-3 py-2 border border-blue-200 rounded-md leading-5 bg-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 min-w-0">
            <button className="p-2 rounded-md text-blue-400 hover:text-orange-500 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-orange-400 rounded-full"></span>
            </button>
            {/* Kullanıcı avatarı ve email sağda */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-400 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-900 max-w-[120px] truncate">{user?.email || 'Kullanıcı'}</span>
              <button
                onClick={async () => { await logoutUser(); router.push('/login') }}
                className="p-1 rounded-md text-blue-400 hover:text-orange-500 hover:bg-orange-100/30 transition-colors"
                title="Çıkış yap"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {/* Page content */}
        <main className="bg-white min-h-screen m-0 p-0">
          {children}
        </main>
      </div>
    </div>
  )
} 