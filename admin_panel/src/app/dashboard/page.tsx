import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const stats = [
    { title: 'Toplam Kullanıcı', value: '1,234', icon: Users, change: '+12%', color: 'text-blue-600' },
    { title: 'Aktif Oturum', value: '89', icon: Activity, change: '+5%', color: 'text-green-600' },
    { title: 'Günlük Ziyaret', value: '2,456', icon: TrendingUp, change: '+18%', color: 'text-purple-600' },
    { title: 'Sistem Durumu', value: 'Aktif', icon: CheckCircle, change: '100%', color: 'text-green-600' },
  ]

  const recentActivities = [
    { id: 1, user: 'Ahmet Yılmaz', action: 'Yeni kullanıcı oluşturdu', time: '2 dakika önce' },
    { id: 2, user: 'Fatma Demir', action: 'Ayarları güncelledi', time: '5 dakika önce' },
    { id: 3, user: 'Mehmet Kaya', action: 'Rapor indirdi', time: '10 dakika önce' },
    { id: 4, user: 'Ayşe Özkan', action: 'Sisteme giriş yaptı', time: '15 dakika önce' },
  ]

  return (
    <div className="space-y-6">
      {/* Hoş Geldin Mesajı */}
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Hoş geldin, {session.user?.name}!</h1>
          <p className="card-description">
            Admin panelinize hoş geldiniz. Sistem durumunu ve son aktiviteleri buradan takip edebilirsiniz.
          </p>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Son Aktiviteler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Son Aktiviteler</h2>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Sistem Durumu</h2>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Veritabanı</span>
                <span className="text-sm text-green-600">Aktif</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Servisleri</span>
                <span className="text-sm text-green-600">Aktif</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">E-posta Servisi</span>
                <span className="text-sm text-yellow-600">Bakımda</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dosya Sistemi</span>
                <span className="text-sm text-green-600">Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 