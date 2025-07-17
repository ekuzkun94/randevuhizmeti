'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Building, 
  Calendar, 
  Plus,
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  X,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Filter,
  Search,
  Grid,
  List,
  BarChart3,
  PieChart,
  TrendingUp,
  Bell,
  Star,
  Heart,
  MapPin,
  Phone,
  Mail,
  Globe,
  Settings,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Users,
  Target,
  Award,
  Zap,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'

interface Appointment {
  id: string
  employeeId: string
  customerId: string
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

interface AppointmentCalendarProps {
  appointments: Appointment[]
  loading: boolean
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
  onAppointmentEdit?: (appointment: Appointment) => void
  onAppointmentDelete?: (appointment: Appointment) => void
  onFileUpload?: (appointmentId: string, files: File[]) => void
}

export function AppointmentCalendar({
  appointments,
  loading,
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentDelete,
  onFileUpload
}: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'timeline'>('calendar')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Takvim navigasyonu
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() - 1)
      return newMonth
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + 1)
      return newMonth
    })
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onDateSelect(today)
  }

  // Takvim günlerini hesapla
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }, [currentMonth])

  // Filtrelenmiş randevular
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.employee.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.service?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [appointments, filterStatus, searchTerm])

  // Günlük randevuları hesapla
  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start)
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Tarih formatları
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'COMPLETED':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'CANCELLED':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      case 'IN_PROGRESS':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <X className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Zap className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (files && selectedAppointment && onFileUpload) {
      const fileArray = Array.from(files)
      onFileUpload(selectedAppointment.id, fileArray)
      setShowFileUpload(false)
    }
  }, [selectedAppointment, onFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Üst Kontrol Paneli */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-orange-50 border-0 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          {/* Sol Taraf - Navigasyon ve Başlık */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousMonth}
                className="hover:bg-white/80 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                {currentMonth.toLocaleDateString('tr-TR', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextMonth}
                className="hover:bg-white/80 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              onClick={goToToday}
              className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Bugün
            </Button>
          </div>

          {/* Sağ Taraf - Kontroller */}
          <div className="flex items-center space-x-4">
            {/* Arama */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Randevu ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-white/80 backdrop-blur-sm border-0 shadow-sm"
              />
            </div>

            {/* Filtre */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="SCHEDULED">Planlandı</SelectItem>
                <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="CANCELLED">İptal</SelectItem>
              </SelectContent>
            </Select>

            {/* Görünüm Modu */}
            <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className="h-8 w-8 p-0"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Toplam Randevu</p>
              <p className="text-2xl font-bold">{filteredAppointments.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-200" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Tamamlanan</p>
              <p className="text-2xl font-bold">
                {filteredAppointments.filter(a => a.status === 'COMPLETED').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Devam Eden</p>
              <p className="text-2xl font-bold">
                {filteredAppointments.filter(a => a.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <Zap className="h-8 w-8 text-yellow-200" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Bu Ay</p>
              <p className="text-2xl font-bold">
                {filteredAppointments.filter(a => {
                  const date = new Date(a.start)
                  return date.getMonth() === currentMonth.getMonth() && 
                         date.getFullYear() === currentMonth.getFullYear()
                }).length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </Card>
      </div>

      {/* Takvim Görünümü */}
      {viewMode === 'calendar' && (
        <Card className="p-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          {/* Haftanın Günleri */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          {/* Takvim Günleri */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              const dayAppointments = getAppointmentsForDate(date)
              const isSelected = selectedDate && 
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear()

              return (
                <div
                  key={index}
                  className={`
                    min-h-[140px] p-3 rounded-xl cursor-pointer transition-all duration-300
                    ${isToday(date) ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 shadow-lg' : ''}
                    ${isSelected ? 'bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 shadow-lg' : ''}
                    ${!isCurrentMonth(date) ? 'bg-gray-50 text-gray-400' : 'bg-white hover:shadow-md hover:scale-105'}
                    ${dayAppointments.length > 0 ? 'ring-2 ring-green-200' : ''}
                  `}
                  onClick={() => {
                    if (isCurrentMonth(date)) {
                      onDateSelect(date)
                    }
                  }}
                >
                  {/* Gün Numarası */}
                  <div className={`
                    text-lg font-bold mb-2 flex items-center justify-between
                    ${isToday(date) ? 'text-blue-700' : ''}
                    ${isSelected ? 'text-purple-700' : ''}
                  `}>
                    {date.getDate()}
                    {isToday(date) && <Sparkles className="h-4 w-4 text-blue-500" />}
                  </div>

                  {/* Randevular */}
                  <div className="space-y-2">
                    {dayAppointments.slice(0, 2).map(appointment => (
                      <div
                        key={appointment.id}
                        className="p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
                        style={{
                          background: appointment.service?.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAppointment(appointment)
                        }}
                      >
                        <div className="text-white text-xs space-y-1">
                          <div className="flex items-center space-x-1 font-semibold">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(appointment.start)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span className="truncate">{appointment.employee.provider.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{appointment.customer.name}</span>
                          </div>
                          {appointment.attachments && appointment.attachments.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{appointment.attachments.length} dosya</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-gray-500 text-center bg-gray-100 rounded-lg py-1">
                        +{dayAppointments.length - 2} daha
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Liste Görünümü */}
      {viewMode === 'list' && (
        <Card className="p-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="space-y-4">
            {filteredAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="p-4 rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4"
                style={{
                  borderLeftColor: appointment.service?.color || '#667eea'
                }}
                onClick={() => setSelectedAppointment(appointment)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {appointment.employee.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-lg">{appointment.employee.name}</h3>
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">
                            {appointment.status === 'SCHEDULED' ? 'Planlandı' :
                             appointment.status === 'COMPLETED' ? 'Tamamlandı' :
                             appointment.status === 'CANCELLED' ? 'İptal' :
                             appointment.status === 'IN_PROGRESS' ? 'Devam Ediyor' : appointment.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(appointment.start)} - {formatTime(appointment.end)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>{appointment.employee.provider.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{appointment.customer.name}</span>
                        </div>
                        {appointment.service && (
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4" />
                            <span>{appointment.service.name} ({appointment.service.duration}dk)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {appointment.attachments && appointment.attachments.length > 0 && (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{appointment.attachments.length}</span>
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline Görünümü */}
      {viewMode === 'timeline' && (
        <Card className="p-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="space-y-6">
            {filteredAppointments.map(appointment => (
              <div key={appointment.id} className="relative">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-orange-500"></div>
                    <div className="w-0.5 h-16 bg-gray-200 mx-auto mt-2"></div>
                  </div>
                  <div className="flex-1 p-4 rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
                       onClick={() => setSelectedAppointment(appointment)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{appointment.employee.name}</h3>
                        <p className="text-gray-600">{appointment.customer.name}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500">{formatTime(appointment.start)}</span>
                          <span className="text-sm text-gray-500">{appointment.employee.provider.name}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1">
                          {appointment.status === 'SCHEDULED' ? 'Planlandı' :
                           appointment.status === 'COMPLETED' ? 'Tamamlandı' :
                           appointment.status === 'CANCELLED' ? 'İptal' :
                           appointment.status === 'IN_PROGRESS' ? 'Devam Ediyor' : appointment.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Randevu Detay Modalı */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <span>Randevu Detayları</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Üst Bilgiler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-orange-50 border-0">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Çalışan Bilgileri
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold">
                          {selectedAppointment.employee.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{selectedAppointment.employee.name}</p>
                          <p className="text-sm text-gray-600">{selectedAppointment.employee.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>{selectedAppointment.employee.provider.name}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border-0">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Müşteri Bilgileri
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {selectedAppointment.customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{selectedAppointment.customer.name}</p>
                          <p className="text-sm text-gray-600">{selectedAppointment.customer.email}</p>
                        </div>
                      </div>
                      {selectedAppointment.customer.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{selectedAppointment.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Randevu Detayları */}
                <Card className="p-4 border-0 shadow-sm">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Randevu Bilgileri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Başlangıç</p>
                      <p className="font-medium">{formatTime(selectedAppointment.start)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Bitiş</p>
                      <p className="font-medium">{formatTime(selectedAppointment.end)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Durum</p>
                      <Badge className={getStatusColor(selectedAppointment.status)}>
                        {getStatusIcon(selectedAppointment.status)}
                        <span className="ml-1">
                          {selectedAppointment.status === 'SCHEDULED' ? 'Planlandı' :
                           selectedAppointment.status === 'COMPLETED' ? 'Tamamlandı' :
                           selectedAppointment.status === 'CANCELLED' ? 'İptal' :
                           selectedAppointment.status === 'IN_PROGRESS' ? 'Devam Ediyor' : selectedAppointment.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  {selectedAppointment.note && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedAppointment.note}</p>
                    </div>
                  )}
                </Card>

                {/* Dosya Yükleme Bölümü */}
                <Card className="p-4 border-0 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Dosyalar
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => setShowFileUpload(true)}
                      className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Dosya Yükle
                    </Button>
                  </div>

                  {selectedAppointment.attachments && selectedAppointment.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedAppointment.attachments.map(file => (
                        <div key={file.id} className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Upload className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Henüz dosya yüklenmemiş</p>
                    </div>
                  )}
                </Card>

                {/* Aksiyon Butonları */}
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                    Kapat
                  </Button>
                  {onAppointmentEdit && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        onAppointmentEdit(selectedAppointment)
                        setSelectedAppointment(null)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                  )}
                  {onAppointmentDelete && (
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        onAppointmentDelete(selectedAppointment)
                        setSelectedAppointment(null)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dosya Yükleme Modalı */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Dosya Yükle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">
                Dosyaları buraya sürükleyin veya seçmek için tıklayın
              </p>
              <p className="text-sm text-gray-500">
                PDF, resim, video ve diğer dosya türleri desteklenir
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                Dosya Seç
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 