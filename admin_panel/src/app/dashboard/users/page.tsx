'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserTable } from '@/components/users/UserTable'
import { UserModal } from '@/components/users/UserModal'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, gradientPresets } from '@/components/ui/StatsCard'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { Users, UserPlus, Shield, Activity, Clock, Mail, Phone, Building } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  lastLoginAt?: string
  image?: string
  phone?: string
  tenantId?: string
}

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    thisMonth: 0,
    online: 0
  })

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/users/stats')
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
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setModalMode('edit')
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleView = (user: User) => {
    // TODO: Implement user detail view
    console.log('View user:', user)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Kullanıcı başarıyla silindi')
        fetchUsers()
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Kullanıcı silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Kullanıcı silinirken hata oluştu')
    }
  }

  const handleSubmit = async (userData: any) => {
    try {
      const url = modalMode === 'create' ? '/api/users' : `/api/users/${selectedUser?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        toast.success(
          modalMode === 'create' 
            ? 'Kullanıcı başarıyla oluşturuldu' 
            : 'Kullanıcı başarıyla güncellendi'
        )
        fetchUsers()
        fetchStats()
        setIsModalOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'İşlem sırasında hata oluştu')
      }
    } catch (error) {
      console.error('Error submitting user:', error)
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  // Table columns for DataTable
  const columns = [
    {
      key: 'user',
      label: 'Kullanıcı',
      render: (value: any, row: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
            {row.image ? (
              <img src={row.image} alt={row.name} className="w-10 h-10 rounded-full" />
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
      key: 'role',
      label: 'Rol',
      render: (value: any, row: User) => (
        <Badge className="bg-blue-100 text-blue-800">
          {typeof row.role === 'object'
            ? row.role.displayName || row.role.name || row.role.id
            : row.role || 'Kullanıcı'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value: any, row: User) => {
        const statusConfig = {
          ACTIVE: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
          INACTIVE: { label: 'Pasif', color: 'bg-gray-100 text-gray-800' },
          SUSPENDED: { label: 'Askıya Alındı', color: 'bg-red-100 text-red-800' }
        }
        const config = statusConfig[row.status as keyof typeof statusConfig] || { label: row.status, color: 'bg-gray-100 text-gray-800' }
        
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        )
      }
    },
    {
      key: 'lastLoginAt',
      label: 'Son Giriş',
      render: (value: any, row: User) => (
        <div>
          <p className="text-sm text-gray-900">
            {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString('tr-TR') : 'Hiç giriş yapmamış'}
          </p>
          {row.lastLoginAt && (
            <p className="text-xs text-gray-500">
              {new Date(row.lastLoginAt).toLocaleTimeString('tr-TR')}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Kayıt Tarihi',
      render: (value: any, row: User) => (
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
      title: 'Toplam Kullanıcı',
      value: stats.total,
      icon: <Users className="h-6 w-6" />,
      gradient: gradientPresets.blue,
      change: { value: 12, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Aktif Kullanıcı',
      value: stats.active,
      icon: <Activity className="h-6 w-6" />,
      gradient: gradientPresets.green,
      change: { value: 8, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Çevrimiçi',
      value: stats.online,
      icon: <Clock className="h-6 w-6" />,
      gradient: gradientPresets.purple,
      change: { value: 5, type: 'neutral' as const, period: 'Şu an' }
    },
    {
      title: 'Bu Ay Eklenen',
      value: stats.thisMonth,
      icon: <UserPlus className="h-6 w-6" />,
      gradient: gradientPresets.orange,
      change: { value: 15, type: 'increase' as const, period: 'Bu ay' }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Sistem kullanıcılarını yönetin, izleyin ve güvenlik ayarlarını kontrol edin"
        icon={<Users className="h-8 w-8" />}
        gradient="from-blue-600 via-purple-600 to-pink-600"
        stats={statsCards}
        actions={
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            <span>Yeni Kullanıcı</span>
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Kullanıcı Yönetimi' }
        ]}
      />

      {/* User Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <DataTable
          data={users}
          columns={columns}
          title="Kullanıcı Listesi"
          description="Tüm sistem kullanıcılarını görüntüleyin ve yönetin"
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
              <UserPlus className="h-4 w-4 mr-2" />
              Yeni Kullanıcı
            </Button>
          }
        />
      </motion.div>

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  )
} 