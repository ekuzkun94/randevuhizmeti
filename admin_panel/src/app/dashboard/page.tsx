'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  UserPlus,
  CalendarDays,
  Activity,
  ArrowUpRight
} from 'lucide-react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0
  })
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      // Demo stats - gerçek uygulamada Firestore'dan çekilecek
      setStats({
        totalUsers: 1247,
        totalAppointments: 3421,
        todayAppointments: 23,
        pendingAppointments: 8
      })
    }
  }, [user, loading, router])

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Toplam Randevu',
      value: stats.totalAppointments.toLocaleString(),
      change: '+8%',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Bugünkü Randevular',
      value: stats.todayAppointments,
      change: '+5%',
      icon: CalendarDays,
      color: 'bg-purple-500'
    },
    {
      title: 'Bekleyen Randevular',
      value: stats.pendingAppointments,
      change: '-2%',
      icon: Clock,
      color: 'bg-orange-500'
    }
  ]

  const recentActivities = [
    { id: 1, user: 'Ahmet Yılmaz', action: 'Yeni randevu oluşturdu', time: '2 dakika önce' },
    { id: 2, user: 'Fatma Demir', action: 'Randevu iptal etti', time: '15 dakika önce' },
    { id: 3, user: 'Mehmet Kaya', action: 'Profil güncelledi', time: '1 saat önce' },
    { id: 4, user: 'Ayşe Özkan', action: 'Yeni hesap oluşturdu', time: '2 saat önce' },
  ]

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Yükleniyor...</div>
    </div>
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 m-0 p-0 w-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-[#1a389c] tracking-tight">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600 font-medium">Hoş geldiniz, <span className="font-bold text-[#ff6a00]">{user.email}</span></p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            const cardGradients = [
              'from-[#1a389c] to-[#274baf]',
              'from-green-400 to-green-600',
              'from-purple-500 to-indigo-600',
              'from-orange-400 to-yellow-400'
            ]
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${cardGradients[index]} shadow-xl rounded-2xl p-6 flex items-center transition-transform hover:scale-[1.03]`}
              >
                <div className="flex-shrink-0">
                  <div className="bg-white/20 rounded-xl p-4 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-6 flex-1">
                  <div className="text-lg font-semibold text-white mb-1">{stat.title}</div>
                  <div className="flex items-end">
                    <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                    <div className="ml-2 flex items-baseline text-base font-semibold text-green-200">
                      <ArrowUpRight className="self-center flex-shrink-0 h-5 w-5 text-green-100" />
                      {stat.change}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Hızlı İşlemler ve Son Aktiviteler */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Quick Actions */}
          <div className="bg-white/80 shadow-xl rounded-2xl p-8 flex flex-col justify-between">
            <h3 className="text-xl font-bold text-[#1a389c] mb-6 flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-[#ff6a00]" /> Hızlı İşlemler
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center px-6 py-4 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-[#ff6a00] to-[#ffb347] shadow hover:scale-105 transition-transform">
                <UserPlus className="h-6 w-6 mr-2" />
                Yeni Kullanıcı
              </button>
              <button className="flex items-center justify-center px-6 py-4 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-[#1a389c] to-[#274baf] shadow hover:scale-105 transition-transform">
                <Calendar className="h-6 w-6 mr-2" />
                Yeni Randevu
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 shadow-xl rounded-2xl p-8">
            <h3 className="text-xl font-bold text-[#1a389c] mb-6 flex items-center gap-2">
              <Activity className="h-6 w-6 text-[#ff6a00]" /> Son Aktiviteler
            </h3>
            <ul className="divide-y divide-blue-50">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="py-4 flex items-center gap-4">
                  <span className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#ff6a00] to-[#ffb347] flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </span>
                  <div className="flex-1">
                    <p className="text-base text-gray-800"><span className="font-bold text-[#1a389c]">{activity.user}</span> {activity.action}</p>
                    <p className="text-sm text-gray-400">{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Ara..."
            className="w-full px-5 py-3 rounded-xl border border-blue-200 bg-white/80 shadow focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-lg placeholder-blue-400"
          />
        </div>

        {/* Recent Appointments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Yaklaşan Randevular
            </h3>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hasta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">AY</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Ahmet Yılmaz</div>
                          <div className="text-sm text-gray-500">ahmet@email.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      15 Aralık 2024
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      14:30
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Onaylandı
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">FD</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Fatma Demir</div>
                          <div className="text-sm text-gray-500">fatma@email.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      16 Aralık 2024
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      10:00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Beklemede
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 