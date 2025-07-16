'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { ServiceTable } from './ServiceTable'
import { ServiceModal } from './ServiceModal'

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [loading, setLoading] = useState(true)

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      } else {
        toast.error('Hizmetler yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Hizmetler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleCreate = () => {
    setSelectedService(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleView = (service: Service) => {
    setSelectedService(service)
    setModalMode('view')
    setIsModalOpen(true)
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`${service.name} hizmetini silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Hizmet başarıyla silindi')
        fetchServices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Hizmet silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Hizmet silinirken hata oluştu')
    }
  }

  const handleSubmit = async (serviceData: Partial<Service>) => {
    try {
      const url = modalMode === 'create' ? '/api/services' : `/api/services/${selectedService?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })

      if (response.ok) {
        toast.success(modalMode === 'create' ? 'Hizmet başarıyla oluşturuldu' : 'Hizmet başarıyla güncellendi')
        setIsModalOpen(false)
        fetchServices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'İşlem sırasında hata oluştu')
      }
    } catch (error) {
      console.error('Error submitting service:', error)
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hizmet Yönetimi</h1>
            <p className="text-muted-foreground">
              Sistem hizmetlerini yönetin ve düzenleyin
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ServiceTable
          services={services}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onCreate={handleCreate}
        />
      </motion.div>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        service={selectedService}
        mode={modalMode}
      />
    </div>
  )
} 