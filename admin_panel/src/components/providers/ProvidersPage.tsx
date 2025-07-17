'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Building, Users, Package, TrendingUp, MapPin, Phone, Mail, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, gradientPresets } from '@/components/ui/StatsCard'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { ProviderTable } from './ProviderTable'
import { ProviderModal } from './ProviderModal'

interface Provider {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  website?: string
  logo?: string
  description?: string
  status?: string
  createdAt: string
  updatedAt: string
  _count?: {
    employees: number
    services: number
    appointments: number
  }
}

export function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    thisMonth: 0,
    totalEmployees: 0,
    totalServices: 0
  })

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: search
      })
      
      const response = await fetch(`/api/providers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/providers/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchProviders()
    fetchStats()
  }, [currentPage, search])

  const handleCreate = () => {
    setEditingProvider(null)
    setShowModal(true)
  }

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider)
    setShowModal(true)
  }

  const handleDelete = async (providerId: string) => {
    if (confirm('Bu hizmet sağlayıcısını silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/providers/${providerId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetchProviders()
          fetchStats()
        }
      } catch (error) {
        console.error('Error deleting provider:', error)
      }
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingProvider(null)
    fetchProviders()
    fetchStats()
  }

  // Table columns for DataTable
  const columns = [
    {
      key: 'provider',
      label: 'Hizmet Sağlayıcı',
      render: (value: any, row: Provider) => (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-semibold">
            {row.logo ? (
              <img src={row.logo} alt={row.name} className="w-12 h-12 rounded-xl" />
            ) : (
              <Building className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'İletişim',
      render: (value: any, row: Provider) => (
        <div className="space-y-1">
          {row.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{row.phone}</span>
            </div>
          )}
          {row.website && (
            <div className="flex items-center space-x-2 text-sm">
              <Globe className="h-4 w-4 text-gray-400" />
              <span className="text-blue-600 hover:underline">{row.website}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'stats',
      label: 'İstatistikler',
      render: (value: any, row: Provider) => (
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">{row._count?.employees || 0}</p>
            <p className="text-xs text-gray-500">Çalışan</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">{row._count?.services || 0}</p>
            <p className="text-xs text-gray-500">Hizmet</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-purple-600">{row._count?.appointments || 0}</p>
            <p className="text-xs text-gray-500">Randevu</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value: any, row: Provider) => {
        const statusConfig = {
          ACTIVE: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
          INACTIVE: { label: 'Pasif', color: 'bg-gray-100 text-gray-800' },
          SUSPENDED: { label: 'Askıya Alındı', color: 'bg-red-100 text-red-800' }
        }
        const config = statusConfig[row.status as keyof typeof statusConfig] || { label: 'Aktif', color: 'bg-green-100 text-green-800' }
        
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        )
      }
    },
    {
      key: 'createdAt',
      label: 'Kayıt Tarihi',
      render: (value: any, row: Provider) => (
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
      title: 'Toplam Sağlayıcı',
      value: stats.total,
      icon: <Building className="h-6 w-6" />,
      gradient: gradientPresets.blue,
      change: { value: 8, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Aktif Sağlayıcı',
      value: stats.active,
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: gradientPresets.green,
      change: { value: 5, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Toplam Çalışan',
      value: stats.totalEmployees,
      icon: <Users className="h-6 w-6" />,
      gradient: gradientPresets.purple,
      change: { value: 12, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Toplam Hizmet',
      value: stats.totalServices,
      icon: <Package className="h-6 w-6" />,
      gradient: gradientPresets.orange,
      change: { value: 15, type: 'increase' as const, period: 'Bu ay' }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Hizmet Sağlayıcıları"
        description="Hizmet sağlayıcılarını yönetin, izleyin ve performanslarını takip edin"
        icon={<Building className="h-8 w-8" />}
        gradient="from-blue-600 via-purple-600 to-pink-600"
        stats={statsCards}
        actions={
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Yeni Hizmet Sağlayıcı</span>
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Hizmet Sağlayıcıları' }
        ]}
      />

      {/* Provider Table */}
      <DataTable
        data={providers}
        columns={columns}
        title="Hizmet Sağlayıcıları Listesi"
        description="Tüm hizmet sağlayıcılarını görüntüleyin ve yönetin"
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
            Yeni Sağlayıcı
          </Button>
        }
      />

      {/* Modal */}
      {showModal && (
        <ProviderModal
          provider={editingProvider}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
} 