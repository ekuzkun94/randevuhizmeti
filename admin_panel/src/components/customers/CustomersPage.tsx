'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Users, UserPlus, Calendar, Star, Phone, Mail, MapPin, Building } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, gradientPresets } from '@/components/ui/StatsCard'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { CustomerTable } from './CustomerTable'
import { CustomerModal } from './CustomerModal'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  avatar?: string
  status?: string
  createdAt: string
  updatedAt: string
  _count?: {
    appointments: number
    totalSpent: number
  }
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    thisMonth: 0,
    totalAppointments: 0,
    totalRevenue: 0
  })

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: search
      })
      
      const response = await fetch(`/api/customers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/customers/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchCustomers()
    fetchStats()
  }, [currentPage, search])

  const handleCreate = () => {
    setEditingCustomer(null)
    setShowModal(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowModal(true)
  }

  const handleDelete = async (customerId: string) => {
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetchCustomers()
          fetchStats()
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
      }
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingCustomer(null)
    fetchCustomers()
    fetchStats()
  }

  // Table columns for DataTable
  const columns = [
    {
      key: 'customer',
      label: 'Müşteri',
      render: (value: any, row: Customer) => (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-semibold">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-12 h-12 rounded-xl" />
            ) : (
              row.name.charAt(0).toUpperCase()
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
      render: (value: any, row: Customer) => (
        <div className="space-y-1">
          {row.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{row.phone}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'stats',
      label: 'İstatistikler',
      render: (value: any, row: Customer) => (
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">{row._count?.appointments || 0}</p>
            <p className="text-xs text-gray-500">Randevu</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">${row._count?.totalSpent || 0}</p>
            <p className="text-xs text-gray-500">Toplam Harcama</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value: any, row: Customer) => {
        const statusConfig = {
          ACTIVE: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
          INACTIVE: { label: 'Pasif', color: 'bg-gray-100 text-gray-800' },
          VIP: { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
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
      render: (value: any, row: Customer) => (
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
      title: 'Toplam Müşteri',
      value: stats.total,
      icon: <Users className="h-6 w-6" />,
      gradient: gradientPresets.blue,
      change: { value: 15, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Aktif Müşteri',
      value: stats.active,
      icon: <UserPlus className="h-6 w-6" />,
      gradient: gradientPresets.green,
      change: { value: 12, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Toplam Randevu',
      value: stats.totalAppointments,
      icon: <Calendar className="h-6 w-6" />,
      gradient: gradientPresets.purple,
      change: { value: 20, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Toplam Gelir',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: <Star className="h-6 w-6" />,
      gradient: gradientPresets.orange,
      change: { value: 18, type: 'increase' as const, period: 'Bu ay' }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Müşteri Yönetimi"
        description="Müşterileri yönetin, izleyin ve müşteri ilişkilerini geliştirin"
        icon={<Users className="h-8 w-8" />}
        gradient="from-blue-600 via-purple-600 to-pink-600"
        stats={statsCards}
        actions={
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Yeni Müşteri</span>
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Müşteri Yönetimi' }
        ]}
      />

      {/* Customer Table */}
      <DataTable
        data={customers}
        columns={columns}
        title="Müşteri Listesi"
        description="Tüm müşterileri görüntüleyin ve yönetin"
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
            Yeni Müşteri
          </Button>
        }
      />

      {/* Modal */}
      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
} 