'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'

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
  service: {
    id: string
    name: string
    duration: number
    price?: number
  }
}

interface Provider {
  id: string
  name: string
  email: string
}

interface Employee {
  id: string
  name: string
  position?: string
  provider: {
    id: string
    name: string
  }
}

interface Customer {
  id: string
  name: string
  email: string
}

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price?: number
  isActive: boolean
}

interface AppointmentModalProps {
  appointment: Appointment | null
  onClose: () => void
}

export function AppointmentModal({ appointment, onClose }: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    providerId: '',
    customerId: '',
    serviceId: '',
    start: '',
    end: '',
    status: 'SCHEDULED',
    note: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string>('')
  const [conflictDetails, setConflictDetails] = useState<any>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])

  const isEditing = !!appointment

  // Helper function to parse datetime-local input
  const parseDateTimeLocal = (dateTimeString: string) => {
    const [datePart, timePart] = dateTimeString.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute, 0)
  }

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  // New helper function to calculate end time without timezone issues
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    // Parse the start time components
    const [datePart, timePart] = startTime.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    
    // Calculate total minutes from start
    const totalMinutes = hour * 60 + minute + durationMinutes
    
    // Calculate new hour and minute
    const newHour = Math.floor(totalMinutes / 60) % 24
    const newMinute = totalMinutes % 60
    
    // Check if we need to move to next day
    const daysToAdd = Math.floor(totalMinutes / (24 * 60))
    const newDay = day + daysToAdd
    
    // Format the result
    const newMonth = String(month).padStart(2, '0')
    const newDayStr = String(newDay).padStart(2, '0')
    const newHourStr = String(newHour).padStart(2, '0')
    const newMinuteStr = String(newMinute).padStart(2, '0')
    
    const result = `${year}-${newMonth}-${newDayStr}T${newHourStr}:${newMinuteStr}`
    
    // Debug log for testing
    console.log('calculateEndTime:', {
      input: { startTime, durationMinutes },
      parsed: { year, month, day, hour, minute },
      calculation: { totalMinutes, newHour, newMinute, daysToAdd, newDay },
      result
    })
    
    return result
  }

  useEffect(() => {
    fetchProviders()
    fetchEmployees()
    fetchCustomers()
    fetchServices()
  }, [])

  useEffect(() => {
    if (appointment) {
      setFormData({
        employeeId: appointment.employeeId,
        providerId: appointment.employee?.provider?.id || '',
        customerId: appointment.customerId,
        serviceId: appointment.serviceId,
        start: new Date(appointment.start).toISOString().slice(0, 16),
        end: new Date(appointment.end).toISOString().slice(0, 16),
        status: appointment.status,
        note: appointment.note || ''
      })
    } else {
      setFormData({
        employeeId: '',
        providerId: '',
        customerId: '',
        serviceId: '',
        start: '',
        end: '',
        status: 'SCHEDULED',
        note: ''
      })
    }
    setErrors({})
    setApiError('')
    setConflictDetails(null)
  }, [appointment])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services?isActive=true')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  // Filter providers based on selected service
  useEffect(() => {
    if (formData.serviceId) {
      fetchProvidersForService(formData.serviceId)
    } else {
      setFilteredProviders(providers)
    }
  }, [formData.serviceId, providers])

  // Filter employees based on selected provider
  useEffect(() => {
    if (formData.providerId) {
      const providerEmployees = employees.filter(emp => emp.provider.id === formData.providerId)
      setFilteredEmployees(providerEmployees)
    } else {
      setFilteredEmployees([])
    }
  }, [formData.providerId, employees])

  const fetchProvidersForService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/providers`)
      if (response.ok) {
        const data = await response.json()
        setFilteredProviders(data.providers || [])
      } else {
        setFilteredProviders(providers)
      }
    } catch (error) {
      console.error('Error fetching providers for service:', error)
      setFilteredProviders(providers)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.serviceId) {
      newErrors.serviceId = 'Hizmet seçimi zorunludur'
    }

    if (!formData.providerId) {
      newErrors.providerId = 'İşletme seçimi zorunludur'
    }

    if (!formData.employeeId) {
      newErrors.employeeId = 'Çalışan seçimi zorunludur'
    }

    if (!formData.customerId) {
      newErrors.customerId = 'Müşteri seçimi zorunludur'
    }

    if (!formData.start) {
      newErrors.start = 'Başlangıç tarihi zorunludur'
    }

    if (!formData.end) {
      newErrors.end = 'Bitiş tarihi zorunludur'
    }

    if (formData.start && formData.end) {
      // Simple string comparison for datetime-local format
      if (formData.start >= formData.end) {
        newErrors.end = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const url = isEditing ? `/api/appointments/${appointment.id}` : '/api/appointments'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onClose()
      } else {
        const errorData = await response.json()
        setApiError(errorData.error || 'Bir hata oluştu')
        
        // Handle conflict details
        if (errorData.details && errorData.details.conflictingAppointment) {
          setConflictDetails(errorData.details)
        } else {
          setConflictDetails(null)
        }
      }
    } catch (error) {
      console.error('Error saving appointment:', error)
      setApiError('Bir hata oluştu')
      setConflictDetails(null)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Reset provider when service changes
    if (field === 'serviceId') {
      setFormData(prev => ({ ...prev, providerId: '', employeeId: '' }))
    }
    
    // Reset employee when provider changes
    if (field === 'providerId') {
      setFormData(prev => ({ ...prev, employeeId: '' }))
    }
    
    // Auto-calculate end time when start time or service changes
    if (field === 'start' || field === 'serviceId') {
      const startTime = field === 'start' ? value : formData.start
      const serviceId = field === 'serviceId' ? value : formData.serviceId
      
      if (startTime && serviceId) {
        const selectedService = services.find(s => s.id === serviceId)
        if (selectedService) {
          // Use the new calculation method that avoids timezone issues
          const endTimeString = calculateEndTime(startTime, selectedService.duration)
          
          console.log('Auto-calculation:', {
            startTime,
            serviceDuration: selectedService.duration,
            endTimeString,
            calculation: `${startTime} + ${selectedService.duration} minutes = ${endTimeString}`
          })
          
          setFormData(prev => ({ 
            ...prev, 
            end: endTimeString 
          }))
        }
      }
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Randevuyu Düzenle' : 'Yeni Randevu'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* API Error Display */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Randevu oluşturulamadı
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{apiError}</p>
                    
                    {/* Conflict Details */}
                    {conflictDetails && (
                      <div className="mt-3 p-3 bg-red-100 rounded-md">
                        <h4 className="font-medium text-red-800 mb-2">Çakışan Randevu Detayları:</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Müşteri:</strong> {conflictDetails.conflictingAppointment.customer}</p>
                          <p><strong>Hizmet:</strong> {conflictDetails.conflictingAppointment.service}</p>
                          <p><strong>Başlangıç:</strong> {conflictDetails.conflictingAppointment.start}</p>
                          <p><strong>Bitiş:</strong> {conflictDetails.conflictingAppointment.end}</p>
                        </div>
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-yellow-800 text-xs">
                            <strong>İstediğiniz zaman:</strong> {conflictDetails.requestedSlot.start} - {conflictDetails.requestedSlot.end}
                          </p>
                        </div>
                        
                        {/* Alternative Slots */}
                        {conflictDetails.alternativeSlots && conflictDetails.alternativeSlots.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <h5 className="font-medium text-blue-800 mb-2">Önerilen Alternatif Zamanlar:</h5>
                            <div className="space-y-2">
                              {conflictDetails.alternativeSlots.map((slot: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div className="text-sm">
                                    <span className="font-medium">
                                      {slot.type === 'before' ? 'Çakışmadan önce:' : 'Çakışmadan sonra:'}
                                    </span>
                                    <br />
                                    <span className="text-blue-700">
                                      {slot.start} - {slot.end}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Parse the Turkish formatted dates back to datetime-local format
                                      const startDate = new Date(slot.start)
                                      const endDate = new Date(slot.end)
                                      setFormData(prev => ({
                                        ...prev,
                                        start: formatDateTimeLocal(startDate),
                                        end: formatDateTimeLocal(endDate)
                                      }))
                                      setApiError('')
                                      setConflictDetails(null)
                                    }}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Bu Zamanı Seç
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceId">Hizmet *</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => handleInputChange('serviceId', value)}
              >
                <SelectTrigger className={errors.serviceId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Hizmet seçin" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{service.name}</span>
                        <span className="text-gray-500 text-xs">
                          {service.duration}dk • {service.price ? `${service.price}₺` : 'Fiyat belirtilmemiş'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceId && (
                <p className="text-red-500 text-sm mt-1">{errors.serviceId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customerId">Müşteri *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => handleInputChange('customerId', value)}
              >
                <SelectTrigger className={errors.customerId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="providerId">İşletme *</Label>
            <Select
              value={formData.providerId}
              onValueChange={(value) => handleInputChange('providerId', value)}
              disabled={!formData.serviceId}
            >
              <SelectTrigger className={errors.providerId ? 'border-red-500' : ''}>
                <SelectValue placeholder={formData.serviceId ? "İşletme seçin" : "Önce hizmet seçin"} />
              </SelectTrigger>
              <SelectContent>
                {filteredProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.providerId && (
              <p className="text-red-500 text-sm mt-1">{errors.providerId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="employeeId">Çalışan *</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => handleInputChange('employeeId', value)}
              disabled={!formData.providerId}
            >
              <SelectTrigger className={errors.employeeId ? 'border-red-500' : ''}>
                <SelectValue placeholder={formData.providerId ? "Çalışan seçin" : "Önce işletme seçin"} />
              </SelectTrigger>
              <SelectContent>
                {filteredEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} {employee.position && `(${employee.position})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && (
              <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Başlangıç Tarihi *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start}
                onChange={(e) => handleInputChange('start', e.target.value)}
                className={errors.start ? 'border-red-500' : ''}
              />
              {errors.start && (
                <p className="text-red-500 text-sm mt-1">{errors.start}</p>
              )}
            </div>

            <div>
              <Label htmlFor="end">
                Bitiş Tarihi *
                {formData.serviceId && formData.start && (
                  <span className="text-xs text-gray-500 ml-2">(Otomatik hesaplanır)</span>
                )}
              </Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) => handleInputChange('end', e.target.value)}
                className={errors.end ? 'border-red-500' : ''}
                readOnly={formData.serviceId && formData.start}
              />
              {errors.end && (
                <p className="text-red-500 text-sm mt-1">{errors.end}</p>
              )}
              {/* Debug info */}
              {formData.serviceId && formData.start && (
                <p className="text-xs text-gray-500 mt-1">
                  Debug: {formData.start} + {services.find(s => s.id === formData.serviceId)?.duration}dk = {formData.end}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Planlandı</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="CANCELLED">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="note">Not</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="Randevu hakkında notlar..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : (isEditing ? 'Güncelle' : 'Oluştur')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 