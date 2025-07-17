'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, List, Grid, BarChart3, TrendingUp, Users, Clock, Filter, Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, gradientPresets } from '@/components/ui/StatsCard'
import { DataTable } from '@/components/ui/DataTable'
import { AppointmentCalendar } from './AppointmentCalendar'
import { AppointmentList } from './AppointmentList'
import { AppointmentModal } from './AppointmentModal'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

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
  attachments?: Array<{
    id: string
    name: string
    type: string
    url: string
    size: number
  }>
  employee: {
    id: string
    name: string
    avatar?: string
    position?: string
    provider: {
      id: string
      name: string
      logo?: string
    }
  }
  customer: {
    id: string
    name: string
    email: string
    avatar?: string
    phone?: string
  }
  service?: {
    id: string
    name: string
    duration: number
    price?: number
    color?: string
  }
}

type ViewMode = 'calendar' | 'list' | 'table'

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [showModal, setShowModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    service: '',
    dateRange: ''
  })

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments')
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

  const handleCreate = () => {
    setEditingAppointment(null)
    setShowModal(true)
  }

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowModal(true)
  }

  const handleDelete = async (appointment: Appointment) => {
    if (confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/appointments/${appointment.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          fetchAppointments()
        }
      } catch (error) {
        console.error('Error deleting appointment:', error)
      }
    }
  }

  const handleFileUpload = async (appointmentId: string, files: File[]) => {
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/appointments/${appointmentId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingAppointment(null)
    fetchAppointments()
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  // İstatistikler
  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
    inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    thisMonth: appointments.filter(a => {
      const date = new Date(a.start)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
  }

  // Trend data for stats cards
  const trendData = [12, 19, 15, 25, 22, 30, 28]

  // Table columns for DataTable
  const columns = [
    {
      key: 'customer',
      label: 'Müşteri',
      render: (value: any, row: Appointment) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
            {row.customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.customer.name}</p>
            <p className="text-sm text-gray-500">{row.customer.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'service',
      label: 'Hizmet',
      render: (value: any, row: Appointment) => (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="font-medium">{row.service?.name || 'Belirtilmemiş'}</span>
        </div>
      )
    },
    {
      key: 'employee',
      label: 'Çalışan',
      render: (value: any, row: Appointment) => (
        <div>
          <p className="font-medium">{row.employee.name}</p>
          <p className="text-sm text-gray-500">{row.employee.provider.name}</p>
        </div>
      )
    },
    {
      key: 'start',
      label: 'Tarih & Saat',
      render: (value: any, row: Appointment) => (
        <div>
          <p className="font-medium">{new Date(row.start).toLocaleDateString('tr-TR')}</p>
          <p className="text-sm text-gray-500">
            {new Date(row.start).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - 
            {new Date(row.end).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value: any, row: Appointment) => {
        const statusConfig = {
          SCHEDULED: { label: 'Planlandı', color: 'bg-blue-100 text-blue-800' },
          IN_PROGRESS: { label: 'Devam Ediyor', color: 'bg-yellow-100 text-yellow-800' },
          COMPLETED: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
          CANCELLED: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800' }
        }
        const config = statusConfig[row.status as keyof typeof statusConfig] || { label: row.status, color: 'bg-gray-100 text-gray-800' }
        
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        )
      }
    }
  ]

  const statsCards = [
    {
      title: 'Toplam Randevu',
      value: stats.total,
      icon: <Calendar className="h-6 w-6" />,
      gradient: gradientPresets.blue,
      change: { value: 12, type: 'increase' as const, period: 'Bu ay' },
      trend: { data: trendData, period: 'Son 7 gün' }
    },
    {
      title: 'Tamamlanan',
      value: stats.completed,
      icon: <Clock className="h-6 w-6" />,
      gradient: gradientPresets.green,
      change: { value: 8, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Planlanan',
      value: stats.scheduled,
      icon: <Calendar className="h-6 w-6" />,
      gradient: gradientPresets.orange,
      change: { value: 15, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Devam Eden',
      value: stats.inProgress,
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: gradientPresets.purple,
      change: { value: 3, type: 'neutral' as const, period: 'Bu ay' }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Randevular"
        description="Gelişmiş takvim görünümü ve randevu yönetimi sistemi"
        icon={<Calendar className="h-8 w-8" />}
        gradient="from-blue-500 to-orange-500"
        stats={statsCards}
        actions={
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Yeni Randevu</span>
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Randevular' }
        ]}
      />

      {/* View Mode Toggle */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Takvim
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Grid className="h-4 w-4 mr-2" />
                Tablo
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Randevu ara..."
                  className="pl-10 w-64"
                />
              </div>
              <Select>
                <option value="">Tüm Durumlar</option>
                <option value="SCHEDULED">Planlandı</option>
                <option value="IN_PROGRESS">Devam Ediyor</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELLED">İptal Edildi</option>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrele
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'calendar' && (
        <AppointmentCalendar
          appointments={appointments}
          onDateSelect={handleDateSelect}
          onAppointmentClick={handleEdit}
          onFileUpload={handleFileUpload}
          loading={loading}
        />
      )}

      {viewMode === 'list' && (
        <AppointmentList
          appointments={appointments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFileUpload={handleFileUpload}
          loading={loading}
        />
      )}

      {viewMode === 'table' && (
        <DataTable
          data={appointments}
          columns={columns}
          title="Randevu Listesi"
          description="Tüm randevuları tablo formatında görüntüleyin"
          searchable={true}
          filterable={true}
          exportable={true}
          pagination={true}
          pageSize={10}
          loading={loading}
          onRowClick={handleEdit}
          actions={
            <Button 
              onClick={handleCreate} 
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Randevu
            </Button>
          }
        />
      )}

      {/* Modal */}
      {showModal && (
        <AppointmentModal
          appointment={editingAppointment}
          onClose={handleModalClose}
          onSave={handleModalClose}
        />
      )}
    </div>
  )
} 