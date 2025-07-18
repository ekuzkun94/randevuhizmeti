'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  X,
  HelpCircle,
  Shield,
  Globe,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  FileText,
  Users as UsersIcon,
  Key,
  Zap,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTheme } from 'next-themes'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  createdAt: string
  isRead: boolean
}

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)


  // Bildirimleri yükle
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?limit=10&unread=true')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.total || 0)
        }
      } catch (error) {
        console.error('Bildirimler yüklenemedi:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // 30 saniyede bir güncelle
    return () => clearInterval(interval)
  }, [])

  // Arama fonksiyonu
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) return

    try {
      // Global arama API'si çağrısı
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const results = await response.json()
        console.log('Arama sonuçları:', results)
        // Burada arama sonuçlarını gösterebiliriz
      }
    } catch (error) {
      console.error('Arama hatası:', error)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Hızlı erişim fonksiyonları
  const handleQuickAccess = (type: string) => {
    switch (type) {
      case 'database':
        window.location.href = '/dashboard/analytics'
        break
      case 'files':
        window.location.href = '/dashboard/files'
        break
      case 'users':
        window.location.href = '/dashboard/users'
        break
      case 'api-keys':
        window.location.href = '/dashboard/api-keys'
        break
      default:
        break
    }
  }



  // Bildirimi okundu olarak işaretle
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Bildirim işaretlenemedi:', error)
    }
  }

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Bildirimler işaretlenemedi:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'warning': return <HelpCircle className="w-4 h-4 text-yellow-500" />
      case 'error': return <X className="w-4 h-4 text-red-500" />
      default: return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'error': return 'border-red-200 bg-red-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  // Kullanıcı menü işlevleri
  const handleUserMenuAction = (action: string) => {
    setShowUserMenu(false)
    
    switch (action) {
      case 'profile':
        window.location.href = '/dashboard/profile'
        break
      case 'settings':
        window.location.href = '/dashboard/settings'
        break
      case 'security':
        window.location.href = '/dashboard/settings?tab=security'
        break
      case 'activity':
        window.location.href = '/dashboard/audit'
        break
      case 'help':
        window.open('/help', '_blank')
        break
      case 'language':
        // Dil değiştirme mantığı burada olabilir
        console.log('Dil değiştirme')
        break
      default:
        break
    }
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Sol Taraf - Arama ve Hızlı Erişim */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="text"
            placeholder="Ara... (kullanıcılar, dosyalar, raporlar)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 w-80 focus:w-96 transition-all duration-300"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X size={12} />
            </Button>
          )}
        </div>

                 {/* Hızlı Erişim Butonları */}
         <div className="hidden lg:flex items-center space-x-2">
           <Button 
             variant="ghost" 
             size="sm" 
             className="h-8 w-8 p-0"
             onClick={() => handleQuickAccess('database')}
             title="Analitik"
           >
             <BarChart3 size={16} />
           </Button>
           <Button 
             variant="ghost" 
             size="sm" 
             className="h-8 w-8 p-0"
             onClick={() => handleQuickAccess('files')}
             title="Dosyalar"
           >
             <FileText size={16} />
           </Button>
           <Button 
             variant="ghost" 
             size="sm" 
             className="h-8 w-8 p-0"
             onClick={() => handleQuickAccess('users')}
             title="Kullanıcılar"
           >
             <UsersIcon size={16} />
           </Button>
           <Button 
             variant="ghost" 
             size="sm" 
             className="h-8 w-8 p-0"
             onClick={() => handleQuickAccess('api-keys')}
             title="API Anahtarları"
           >
             <Key size={16} />
           </Button>
         </div>
      </div>

      {/* Sağ Taraf - Tema, Bildirimler, Kullanıcı */}
      <div className="flex items-center space-x-4">

        {/* Tema Değiştirici */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 p-0"
          title={`${theme === 'dark' ? 'Açık' : 'Koyu'} temaya geç`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* Bildirimler */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative h-8 w-8 p-0"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Bildirimler"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Bildirim Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50"
              >
                <Card className="border-0 shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Bildirimler</CardTitle>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="h-6 text-xs"
                        >
                          Tümünü okundu işaretle
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Bell size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Bildirim bulunmuyor</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-border last:border-b-0 hover:bg-accent cursor-pointer ${
                              !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notification.createdAt).toLocaleString('tr-TR')}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-border">
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                          Tüm bildirimleri görüntüle
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Kullanıcı Menüsü */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {session?.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium truncate max-w-32">
                {session?.user?.name || 'Kullanıcı'}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-32">
                {session?.user?.email}
              </p>
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50"
              >
                <Card className="border-0 shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={session?.user?.image || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{session?.user?.name || 'Kullanıcı'}</p>
                        <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Admin
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="py-1">
                      <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center transition-colors"
                        onClick={() => handleUserMenuAction('profile')}
                      >
                        <User size={16} className="mr-3" />
                        Profil
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center transition-colors"
                        onClick={() => handleUserMenuAction('settings')}
                      >
                        <Settings size={16} className="mr-3" />
                        Ayarlar
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center transition-colors"
                        onClick={() => handleUserMenuAction('security')}
                      >
                        <Shield size={16} className="mr-3" />
                        Güvenlik
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center transition-colors"
                        onClick={() => handleUserMenuAction('activity')}
                      >
                        <Activity size={16} className="mr-3" />
                        Aktivite
                      </button>
                      <hr className="my-1" />
                      <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center transition-colors"
                        onClick={() => handleUserMenuAction('help')}
                      >
                        <HelpCircle size={16} className="mr-3" />
                        Yardım
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center transition-colors"
                        onClick={() => handleUserMenuAction('language')}
                      >
                        <Globe size={16} className="mr-3" />
                        Dil: Türkçe
                      </button>
                      <hr className="my-1" />
                      <button 
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center text-destructive transition-colors"
                      >
                        <LogOut size={16} className="mr-3" />
                        Çıkış Yap
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dışarı tıklandığında menüleri kapat */}
      {(showUserMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowUserMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </header>
  )
} 