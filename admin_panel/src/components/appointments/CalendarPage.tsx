'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, BarChart3, TrendingUp, Users, Clock, Filter, Download, Search, Zap, Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, gradientPresets } from '@/components/ui/StatsCard'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import AppointmentCalendarBig from './AppointmentCalendarBig'
import QuickAppointmentModal from './QuickAppointmentModal'
import RecurringAppointmentModal from './RecurringAppointmentModal'
import SmartScheduler from './SmartScheduler'
import NotificationManager from './NotificationManager'

interface Appointment {
  id: string
  employeeId: string
  customerId: string
  serviceId: string
  start: string
  end: string
  status: string
  note?: string
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    name: string
    provider: {
      id: string
      name: string
    }
  }
  customer: {
    id: string
    name: string
    email: string
  }
  service?: {
    id: string
    name: string
    duration: number
    price?: number
  }
}

export function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuickModal, setShowQuickModal] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showSmartScheduler, setShowSmartScheduler] = useState(false)
  const [showNotificationManager, setShowNotificationManager] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    service: '',
    employee: '',
    customer: ''
  })

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments?limit=100')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const handleSlotSelect = (slotInfo: any) => {
    setSelectedSlot(slotInfo)
    setShowQuickModal(true)
  }

  const handleQuickAppointmentSave = async (appointmentData: any) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      if (response.ok) {
        fetchAppointments()
        setShowQuickModal(false)
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
    }
  }

  const handleRecurringAppointmentSave = async (appointmentData: any) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      if (response.ok) {
        fetchAppointments()
        setShowRecurringModal(false)
      }
    } catch (error) {
      console.error('Error creating recurring appointment:', error)
    }
  }

  // İstatistikler
  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
    inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    thisWeek: appointments.filter(a => {
      const date = new Date(a.start)
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6))
      return date >= weekStart && date <= weekEnd
    }).length,
    today: appointments.filter(a => {
      const date = new Date(a.start)
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }).length
  }

  // Trend data for stats cards
  const trendData = [12, 19, 15, 25, 22, 30, 28]

  const statsCards = [
    {
      title: 'Bugünkü Randevular',
      value: stats.today,
      icon: <Calendar className="h-6 w-6" />,
      gradient: gradientPresets.blue,
      change: { value: 5, type: 'increase' as const, period: 'Dünden' },
      trend: { data: trendData, period: 'Son 7 gün' }
    },
    {
      title: 'Bu Hafta',
      value: stats.thisWeek,
      icon: <Clock className="h-6 w-6" />,
      gradient: gradientPresets.green,
      change: { value: 8, type: 'increase' as const, period: 'Geçen haftadan' }
    },
    {
      title: 'Planlanan',
      value: stats.scheduled,
      icon: <Calendar className="h-6 w-6" />,
      gradient: gradientPresets.orange,
      change: { value: 15, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Tamamlanan',
      value: stats.completed,
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: gradientPresets.purple,
      change: { value: 12, type: 'increase' as const, period: 'Bu ay' }
    }
  ]

  const quickActions = [
    {
      title: 'Hızlı Randevu',
      description: 'Tek randevu oluştur',
      icon: <Plus className="h-5 w-5" />,
      onClick: () => setShowQuickModal(true),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Tekrarlayan Randevu',
      description: 'Haftalık/aylık tekrarlar',
      icon: <Calendar className="h-5 w-5" />,
      onClick: () => setShowRecurringModal(true),
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Akıllı Öneriler',
      description: 'En uygun zaman dilimleri',
      icon: <Zap className="h-5 w-5" />,
      onClick: () => setShowSmartScheduler(true),
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'Bildirim Yönetimi',
      description: 'Otomatik hatırlatmalar',
      icon: <Bell className="h-5 w-5" />,
      onClick: () => setShowNotificationManager(true),
      gradient: 'from-purple-500 to-pink-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Takvim"
        description="Gelişmiş takvim görünümü ve akıllı randevu yönetimi sistemi"
        icon={<Calendar className="h-8 w-8" />}
        gradient="from-blue-500 to-purple-500"
        stats={statsCards}
        actions={
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => setShowQuickModal(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Hızlı Randevu</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowSmartScheduler(true)}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Zap className="h-4 w-4 mr-2" />
              <span>Akıllı Öneriler</span>
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Randevular', href: '/dashboard/appointments' },
          { label: 'Takvim' }
        ]}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-md"
            onClick={action.onClick}
          >
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.gradient} flex items-center justify-center text-white mb-4`}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Randevu ara..."
                  className="pl-10 w-64"
                />
              </div>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <option value="">Tüm Durumlar</option>
                <option value="SCHEDULED">Planlandı</option>
                <option value="IN_PROGRESS">Devam Ediyor</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELLED">İptal Edildi</option>
              </Select>
              <Select 
                value={filters.provider} 
                onValueChange={(value) => setFilters({ ...filters, provider: value })}
              >
                <option value="">Tüm Sağlayıcılar</option>
                {/* Provider options will be loaded dynamically */}
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrele
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {stats.today} Bugün
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {stats.thisWeek} Bu Hafta
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <AppointmentCalendarBig
            appointments={appointments}
            onSlotSelect={handleSlotSelect}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      {showQuickModal && (
        <QuickAppointmentModal
          isOpen={showQuickModal}
          onClose={() => setShowQuickModal(false)}
          slotInfo={selectedSlot}
          onSave={handleQuickAppointmentSave}
        />
      )}

      {showRecurringModal && (
        <RecurringAppointmentModal
          isOpen={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          slotInfo={selectedSlot}
          onSave={handleRecurringAppointmentSave}
        />
      )}

      {showSmartScheduler && (
        <SmartScheduler
          isOpen={showSmartScheduler}
          onClose={() => setShowSmartScheduler(false)}
          onSave={handleQuickAppointmentSave}
        />
      )}

      {showNotificationManager && (
        <NotificationManager
          isOpen={showNotificationManager}
          onClose={() => setShowNotificationManager(false)}
        />
      )}
    </div>
  )
} 