'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, List, Grid, BarChart3, TrendingUp, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AppointmentCalendar } from './AppointmentCalendar'
import { AppointmentList } from './AppointmentList'
import { AppointmentModal } from './AppointmentModal'
import { Badge } from '@/components/ui/Badge'

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

type ViewMode = 'calendar' | 'list'

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [showModal, setShowModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

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
    if (viewMode === 'list') {
      // List view'da tarih seçildiğinde o tarihe ait randevuları filtrele
      // Bu özellik daha sonra eklenebilir
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Randevular
          </h1>
          <p className="text-gray-600 mt-1">Gelişmiş takvim görünümü ve randevu yönetimi</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Yeni Randevu</span>
          </Button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Toplam</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-200" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Tamamlanan</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <Clock className="h-8 w-8 text-green-200" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Planlandı</p>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-200" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Devam Eden</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">İptal</p>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
            <Users className="h-8 w-8 text-red-200" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Bu Ay</p>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-indigo-200" />
          </div>
        </Card>
      </div>

      {/* Ana İçerik */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <CardTitle className="text-xl font-bold text-gray-800">
              {viewMode === 'calendar' ? 'Gelişmiş Takvim Görünümü' : 'Randevu Listesi'}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Takvim</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex items-center space-x-2"
                >
                  <List className="h-4 w-4" />
                  <span>Liste</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'calendar' ? (
            <AppointmentCalendar
              appointments={appointments}
              loading={loading}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onAppointmentClick={handleEdit}
              onAppointmentEdit={handleEdit}
              onAppointmentDelete={handleDelete}
              onFileUpload={handleFileUpload}
            />
          ) : (
            <div className="p-6">
              <AppointmentList
                appointments={appointments}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <AppointmentModal
          appointment={editingAppointment}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
} 