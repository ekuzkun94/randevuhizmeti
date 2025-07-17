"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EmployeeTable } from '@/components/employees/EmployeeTable'
import { EmployeeModal } from '@/components/employees/EmployeeModal'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, gradientPresets } from '@/components/ui/StatsCard'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { Users, UserPlus, Building, Calendar, Star, Phone, Mail, Briefcase, Plus } from 'lucide-react'

interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  position?: string
  isActive: boolean
  avatar?: string
  hireDate?: string
  salary?: number
  provider: {
    id: string
    name: string
    logo?: string
  }
  providerId: string
  createdAt: string
  _count?: {
    appointments: number
    completedAppointments: number
  }
}

export default function EmployeesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    thisMonth: 0,
    totalAppointments: 0,
    totalProviders: 0
  })

  useEffect(() => {
    fetchEmployees()
    fetchStats()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/employees/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setSelectedEmployee(null)
    setIsModalOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setModalMode('edit')
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  const handleView = (employee: Employee) => {
    // TODO: Detay görüntüleme
    console.log('View employee:', employee)
  }

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) {
      return
    }
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Çalışan başarıyla silindi')
        fetchEmployees()
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Çalışan silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Çalışan silinirken hata oluştu')
    }
  }

  const handleSubmit = async (employeeData: any) => {
    try {
      const url = modalMode === 'create' ? '/api/employees' : `/api/employees/${selectedEmployee?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      })
      if (response.ok) {
        toast.success(
          modalMode === 'create' 
            ? 'Çalışan başarıyla oluşturuldu' 
            : 'Çalışan başarıyla güncellendi'
        )
        fetchEmployees()
        fetchStats()
        setIsModalOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'İşlem sırasında hata oluştu')
      }
    } catch (error) {
      console.error('Error submitting employee:', error)
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  // Table columns for DataTable
  const columns = [
    {
      key: 'employee',
      label: 'Çalışan',
      render: (value: any, row: Employee) => (
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
            <p className="text-sm text-gray-500">{row.position || 'Pozisyon belirtilmemiş'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'provider',
      label: 'İşletme',
      render: (value: any, row: Employee) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold">
            {row.provider.logo ? (
              <img src={row.provider.logo} alt={row.provider.name} className="w-8 h-8 rounded-lg" />
            ) : (
              <Building className="h-4 w-4" />
            )}
          </div>
          <span className="font-medium text-gray-900">{row.provider.name}</span>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'İletişim',
      render: (value: any, row: Employee) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{row.phone}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'stats',
      label: 'Performans',
      render: (value: any, row: Employee) => (
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">{row._count?.appointments || 0}</p>
            <p className="text-xs text-gray-500">Toplam</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">{row._count?.completedAppointments || 0}</p>
            <p className="text-xs text-gray-500">Tamamlanan</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value: any, row: Employee) => (
        <Badge className={row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {row.isActive ? 'Aktif' : 'Pasif'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'İşe Başlama',
      render: (value: any, row: Employee) => (
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
      title: 'Toplam Çalışan',
      value: stats.total,
      icon: <Users className="h-6 w-6" />,
      gradient: gradientPresets.blue,
      change: { value: 10, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Aktif Çalışan',
      value: stats.active,
      icon: <UserPlus className="h-6 w-6" />,
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
      title: 'İşletme Sayısı',
      value: stats.totalProviders,
      icon: <Building className="h-6 w-6" />,
      gradient: gradientPresets.orange,
      change: { value: 5, type: 'increase' as const, period: 'Bu ay' }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Çalışan Yönetimi"
        description="İşletmelere bağlı çalışanları yönetin, izleyin ve performanslarını takip edin"
        icon={<Users className="h-8 w-8" />}
        gradient="from-blue-600 via-purple-600 to-pink-600"
        stats={statsCards}
        actions={
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Yeni Çalışan</span>
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Çalışan Yönetimi' }
        ]}
      />

      {/* Employee Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <DataTable
          data={employees}
          columns={columns}
          title="Çalışan Listesi"
          description="Tüm çalışanları görüntüleyin ve yönetin"
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
              Yeni Çalışan
            </Button>
          }
        />
      </motion.div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        employee={selectedEmployee}
        mode={modalMode}
      />
    </div>
  )
} 