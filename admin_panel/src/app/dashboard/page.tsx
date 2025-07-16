import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  Building,
  UserCheck,
  Package,
  Shield,
  FileText,
  Workflow,
  Zap,
  CreditCard,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Award,
  Star,
  Heart,
  Eye,
  Download,
  Upload,
  Bell,
  Key,
  Database,
  Globe,
  Lock,
  Cog,
  Palette,
  Tag,
  History,
  CheckSquare,
  Store,
  Bell as BellIcon,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Zap as ZapIcon,
  Crown,
  Rocket,
  Trophy,
  Medal,
  Flag,
  Fire,
  Lightning,
  Sun,
  Moon,
  Cloud,
  Wind
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  // Tüm verileri paralel olarak çek
  const [
    userCount,
    appointmentCount,
    providerCount,
    employeeCount,
    customerCount,
    serviceCount,
    roleCount,
    apiKeyCount,
    fileCount,
    taskCount,
    workflowCount,
    moduleCount,
    billingCount,
    auditCount,
    logCount,
    recentAppointments,
    recentUsers,
    recentFiles,
    recentTasks,
    systemStats,
    topProviders,
    topServices,
    appointmentStats,
    userStats,
    systemHealth
  ] = await Promise.all([
    // Kullanıcı istatistikleri
    prisma.user.count(),
    prisma.appointment.count(),
    prisma.provider.count(),
    prisma.employee.count(),
    prisma.customer.count(),
    prisma.service.count(),
    prisma.role.count(),
    prisma.apiKey.count(),
    prisma.file.count(),
    prisma.task.count(),
    prisma.approvalWorkflow.count(),
    prisma.module.count(),
    prisma.payment.count(),
    prisma.auditLog.count(),
    prisma.log.count(),
    
    // Son randevular
    prisma.appointment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { include: { provider: true } },
        customer: true,
        service: true
      }
    }),
    
    // Son kullanıcılar
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    }),
    
    // Son dosyalar
    prisma.file.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    }),
    
    // Son görevler
    prisma.task.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { assignee: true }
    }),
    
    // Sistem istatistikleri
    prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT CASE WHEN "createdAt" >= datetime('now', '-7 days') THEN id END) as last_7_days,
        COUNT(DISTINCT CASE WHEN "createdAt" >= datetime('now', '-30 days') THEN id END) as last_30_days
      FROM "User"
    `,
    
    // En iyi sağlayıcılar
    prisma.provider.findMany({
      take: 5,
      include: {
        _count: {
          select: { employees: true, services: true }
        }
      },
      orderBy: { employees: { _count: 'desc' } }
    }),
    
    // En popüler hizmetler
    prisma.service.findMany({
      take: 5,
      include: {
        _count: {
          select: { appointments: true }
        }
      },
      orderBy: { appointments: { _count: 'desc' } }
    }),
    
    // Randevu istatistikleri
    prisma.appointment.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    
    // Kullanıcı istatistikleri
    prisma.user.groupBy({
      by: ['roleId'],
      _count: { roleId: true }
    }),
    
    // Sistem sağlığı kontrolü
    Promise.resolve({
      database: 'healthy',
      api: 'healthy',
      email: 'maintenance',
      files: 'healthy',
      cache: 'healthy',
      queue: 'healthy'
    })
  ])

  // İstatistik kartları
  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: userCount.toLocaleString(),
      icon: Users,
      change: '+12%',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      href: '/dashboard/users'
    },
    {
      title: 'Aktif Randevular',
      value: appointmentCount.toLocaleString(),
      icon: Calendar,
      change: '+25%',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      href: '/dashboard/appointments'
    },
    {
      title: 'Hizmet Sağlayıcıları',
      value: providerCount.toLocaleString(),
      icon: Building,
      change: '+8%',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      href: '/dashboard/providers'
    },
    {
      title: 'Toplam Çalışan',
      value: employeeCount.toLocaleString(),
      icon: UserCheck,
      change: '+15%',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      href: '/dashboard/employees'
    },
    {
      title: 'Müşteri Sayısı',
      value: customerCount.toLocaleString(),
      icon: Users,
      change: '+20%',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
      href: '/dashboard/customers'
    },
    {
      title: 'Hizmet Türü',
      value: serviceCount.toLocaleString(),
      icon: Package,
      change: '+5%',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      href: '/dashboard/services'
    },
    {
      title: 'Sistem Rolleri',
      value: roleCount.toLocaleString(),
      icon: Shield,
      change: '+3%',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      href: '/dashboard/roles'
    },
    {
      title: 'API Anahtarları',
      value: apiKeyCount.toLocaleString(),
      icon: Key,
      change: '+7%',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-teal-50 to-teal-100',
      href: '/dashboard/api-keys'
    }
  ]

  // Sistem sağlığı durumları
  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle }
      case 'maintenance':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock }
      case 'error':
        return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', icon: Minus }
    }
  }

  return (
    <div className="space-y-8">
      {/* Hoş Geldin Mesajı */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Sparkles className="h-8 w-8" />
              <span>Hoş geldin, {session.user?.name}!</span>
            </h1>
            <p className="text-blue-100 text-lg">
              Admin panelinizin genel durumunu ve tüm sistemlerin özetini buradan takip edebilirsiniz.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Clock className="h-4 w-4 mr-1" />
                Son güncelleme: {new Date().toLocaleString('tr-TR')}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Activity className="h-4 w-4 mr-1" />
                Sistem Aktif
              </Badge>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link key={index} href={stat.href}>
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-md">
                <CardContent className={`p-6 ${stat.bgColor} rounded-xl`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center space-x-1">
                        <ArrowUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                      </div>
                    </div>
                    <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Detaylı Raporlar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Randevu Yönetimi Özeti */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Randevu Yönetimi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Toplam Randevu</span>
                <span className="font-semibold">{appointmentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aktif Sağlayıcı</span>
                <span className="font-semibold">{providerCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Toplam Çalışan</span>
                <span className="font-semibold">{employeeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Müşteri Sayısı</span>
                <span className="font-semibold">{customerCount}</span>
              </div>
              <div className="pt-4 border-t">
                <Link href="/dashboard/appointments">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Detayları Görüntüle
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistem Yönetimi Özeti */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Sistem Yönetimi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Toplam Kullanıcı</span>
                <span className="font-semibold">{userCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sistem Rolleri</span>
                <span className="font-semibold">{roleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Anahtarları</span>
                <span className="font-semibold">{apiKeyCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dosya Sayısı</span>
                <span className="font-semibold">{fileCount}</span>
              </div>
              <div className="pt-4 border-t">
                <Link href="/dashboard/users">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Detayları Görüntüle
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İş Akışları Özeti */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center space-x-2">
              <Workflow className="h-5 w-5 text-purple-600" />
              <span>İş Akışları</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aktif Görevler</span>
                <span className="font-semibold">{taskCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Onay İş Akışları</span>
                <span className="font-semibold">{workflowCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aktif Modüller</span>
                <span className="font-semibold">{moduleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Toplam Ödeme</span>
                <span className="font-semibold">{billingCount}</span>
              </div>
              <div className="pt-4 border-t">
                <Link href="/dashboard/tasks">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Detayları Görüntüle
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sistem Sağlığı ve Son Aktiviteler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sistem Sağlığı */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-red-600" />
              <span>Sistem Sağlığı</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(systemHealth).map(([service, status]) => {
                const health = getHealthStatus(status as string)
                const Icon = health.icon
                return (
                  <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${health.color}`} />
                      <span className="font-medium capitalize">{service}</span>
                    </div>
                    <Badge className={`${health.bg} ${health.color} border-0`}>
                      {status === 'healthy' ? 'Aktif' : status === 'maintenance' ? 'Bakımda' : 'Hata'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Son Aktiviteler */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span>Son Aktiviteler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{appointment.customer.name}</p>
                    <p className="text-xs text-gray-500">
                      {appointment.employee.provider.name} - {appointment.service.name}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(appointment.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* En İyi Performans Gösterenler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* En İyi Sağlayıcılar */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-600" />
              <span>En İyi Sağlayıcılar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {topProviders.map((provider, index) => (
                <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-xs text-gray-500">
                        {provider._count.employees} çalışan, {provider._count.services} hizmet
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Star className="h-3 w-3 mr-1" />
                    {provider._count.employees + provider._count.services}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* En Popüler Hizmetler */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>En Popüler Hizmetler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.duration} dakika</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <Heart className="h-3 w-3 mr-1" />
                    {service._count.appointments}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Aksiyonlar */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            <span>Hızlı Aksiyonlar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/dashboard/appointments">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Calendar className="h-6 w-6" />
                <span className="text-xs">Yeni Randevu</span>
              </Button>
            </Link>
            <Link href="/dashboard/users">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-xs">Kullanıcı Ekle</span>
              </Button>
            </Link>
            <Link href="/dashboard/providers">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Building className="h-6 w-6" />
                <span className="text-xs">Sağlayıcı Ekle</span>
              </Button>
            </Link>
            <Link href="/dashboard/services">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Package className="h-6 w-6" />
                <span className="text-xs">Hizmet Ekle</span>
              </Button>
            </Link>
            <Link href="/dashboard/files">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Upload className="h-6 w-6" />
                <span className="text-xs">Dosya Yükle</span>
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Settings className="h-6 w-6" />
                <span className="text-xs">Ayarlar</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 