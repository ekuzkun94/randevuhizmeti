'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { RoleModal } from '@/components/roles/RoleModal'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
  displayName: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  createdAt: string
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles')
      const data = await response.json()
      
      if (response.ok) {
        setRoles(data.roles)
      } else {
        toast.error('Roller yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Roller yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleCreateRole = async (roleData: Omit<Role, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      })

      if (response.ok) {
        toast.success('Rol başarıyla oluşturuldu')
        fetchRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Rol oluşturulurken hata oluştu')
      }
    } catch (error) {
      toast.error('Rol oluşturulurken hata oluştu')
    }
  }

  const handleUpdateRole = async (roleData: Omit<Role, 'id' | 'createdAt'>) => {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      })

      if (response.ok) {
        toast.success('Rol başarıyla güncellendi')
        fetchRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Rol güncellenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Rol güncellenirken hata oluştu')
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Bu rolü silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Rol başarıyla silindi')
        fetchRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Rol silinirken hata oluştu')
      }
    } catch (error) {
      toast.error('Rol silinirken hata oluştu')
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedRole(null)
    setShowModal(true)
  }

  const openEditModal = (role: Role) => {
    setModalMode('edit')
    setSelectedRole(role)
    setShowModal(true)
  }

  const handleModalSubmit = (roleData: Omit<Role, 'id' | 'createdAt'>) => {
    if (modalMode === 'create') {
      handleCreateRole(roleData)
    } else {
      handleUpdateRole(roleData)
    }
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPermissionColor = (permission: string) => {
    if (permission.includes('*')) return 'text-green-600 bg-green-100'
    if (permission.includes('read')) return 'text-blue-600 bg-blue-100'
    if (permission.includes('write') || permission.includes('update')) return 'text-yellow-600 bg-yellow-100'
    if (permission.includes('delete')) return 'text-red-600 bg-red-100'
    return 'text-gray-600 bg-gray-100'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Roller yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rol Yönetimi</h1>
          <p className="text-muted-foreground">Sistem rollerini ve yetkilerini yönetin</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} className="mr-2" />
          Yeni Rol
        </Button>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Rollerde ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Roller Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <div key={role.id} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield size={20} className="text-primary" />
                  <h3 className="card-title">{role.displayName}</h3>
                </div>
                {role.isSystem && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    Sistem
                  </span>
                )}
              </div>
              <p className="card-description">{role.description}</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {/* Kullanıcı Sayısı */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kullanıcı Sayısı</span>
                  <div className="flex items-center space-x-1">
                    <Users size={16} />
                    <span className="font-medium">{role.userCount}</span>
                  </div>
                </div>

                {/* Yetkiler */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Yetkiler</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(permission)}`}
                      >
                        {permission}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{role.permissions.length - 3} daha
                      </span>
                    )}
                  </div>
                </div>

                {/* Aksiyonlar */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditModal(role)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Users size={16} />
                    </Button>
                    {!role.isSystem && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-xs text-muted-foreground">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Yetki Matrisi */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Yetki Matrisi</h2>
          <p className="card-description">Rollerin sahip olduğu yetkilerin detaylı görünümü</p>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Rol</th>
                  <th className="text-left py-3 px-4 font-medium">Kullanıcı Yönetimi</th>
                  <th className="text-left py-3 px-4 font-medium">Rol Yönetimi</th>
                  <th className="text-left py-3 px-4 font-medium">Ayarlar</th>
                  <th className="text-left py-3 px-4 font-medium">Loglar</th>
                  <th className="text-left py-3 px-4 font-medium">API</th>
                  <th className="text-left py-3 px-4 font-medium">Dosyalar</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b border-border">
                    <td className="py-3 px-4 font-medium">{role.displayName}</td>
                    <td className="py-3 px-4">
                      {role.permissions.some(p => p.includes('users')) ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {role.permissions.some(p => p.includes('roles')) ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {role.permissions.some(p => p.includes('settings')) ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {role.permissions.some(p => p.includes('logs')) ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {role.permissions.some(p => p.includes('api')) ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {role.permissions.some(p => p.includes('files')) ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        role={selectedRole}
        mode={modalMode}
      />
    </div>
  )
} 