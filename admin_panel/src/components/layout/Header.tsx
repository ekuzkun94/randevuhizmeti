'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTheme } from 'next-themes'

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Ara..."
            className="pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Tema Değiştirici */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* Bildirimler */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Kullanıcı Menüsü */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User size={16} className="text-primary-foreground" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{session?.user?.name || 'Kullanıcı'}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <ChevronDown size={16} />
          </button>

          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50"
            >
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center">
                  <User size={16} className="mr-2" />
                  Profil
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center">
                  <Settings size={16} className="mr-2" />
                  Ayarlar
                </button>
                <hr className="my-1" />
                <button 
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center text-destructive"
                >
                  <LogOut size={16} className="mr-2" />
                  Çıkış Yap
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  )
} 