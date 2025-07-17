'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, gradientPresets } from '@/components/ui/StatsCard'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ServiceTable } from './ServiceTable'
import { ServiceModal } from './ServiceModal'
import { Package, Clock, DollarSign, TrendingUp, Star, Users, Calendar, Plus } from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price?: number
  isActive: boolean
  color?: string
  category?: string
  createdAt: string
  updatedAt: string
  _count?: {
    appointments: number
    providers: number
  }
}

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    thisMonth: 0,
    totalAppointments: 0,
    totalRevenue: 0
  })

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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/services/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchStats()
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
        fetchStats()
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
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'İşlem sırasında hata oluştu')
      }
    } catch (error) {
      console.error('Error submitting service:', error)
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  // Table columns for DataTable
  const columns = [
    {
      key: 'service',
      label: 'Hizmet',
      render: (value: any, row: Service) => (
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold ${
            row.color ? `bg-${row.color}-500` : 'bg-gradient-to-br from-blue-500 to-orange-500'
          }`}>
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.description || 'Açıklama yok'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'duration',
      label: 'Süre',
      render: (value: any, row: Service) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{row.duration} dakika</span>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Fiyat',
      render: (value: any, row: Service) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="font-medium text-green-600">
            {row.price ? `$${row.price}` : 'Belirtilmemiş'}
          </span>
        </div>
      )
    },
    {
      key: 'stats',
      label: 'İstatistikler',
      render: (value: any, row: Service) => (
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">{row._count?.appointments || 0}</p>
            <p className="text-xs text-gray-500">Randevu</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-purple-600">{row._count?.providers || 0}</p>
            <p className="text-xs text-gray-500">Sağlayıcı</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value: any, row: Service) => (
        <Badge className={row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {row.isActive ? 'Aktif' : 'Pasif'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Oluşturulma',
      render: (value: any, row: Service) => (
        <div>
          <p className="text-sm text-gray-900">
            {new Date(row.createdAt).toLocaleDateString('tr-TR')}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(row.createdAt).toLocaleTimeString('tr-TR')}
          </p>
        </div>
      )
    }
  ]

  const statsCards = [
    {
      title: 'Toplam Hizmet',
      value: stats.total,
      icon: <Package className="h-6 w-6" />,
      gradient: gradientPresets.blue,
      change: { value: 10, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Aktif Hizmet',
      value: stats.active,
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: gradientPresets.green,
      change: { value: 8, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Toplam Randevu',
      value: stats.totalAppointments,
      icon: <Calendar className="h-6 w-6" />,
      gradient: gradientPresets.purple,
      change: { value: 15, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Toplam Gelir',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6" />,
      gradient: gradientPresets.orange,
      change: { value: 12, type: 'increase' as const, period: 'Bu ay' }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Hizmet Yönetimi"
        description="Sistem hizmetlerini yönetin, düzenleyin ve performanslarını takip edin"
        icon={<Package className="h-8 w-8" />}
        gradient="from-blue-600 via-purple-600 to-pink-600"
        stats={statsCards}
        actions={
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Yeni Hizmet</span>
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Hizmet Yönetimi' }
        ]}
      />

      {/* Service Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <DataTable
          data={services}
          columns={columns}
          title="Hizmet Listesi"
          description="Tüm sistem hizmetlerini görüntüleyin ve yönetin"
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
              Yeni Hizmet
            </Button>
          }
        />
      </motion.div>

      {/* Service Modal */}
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