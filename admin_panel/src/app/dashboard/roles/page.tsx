'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  CheckCircle,
  XCircle,
  Search,
  Crown,
  UserCheck,
  Lock,
  Settings,
  FileText,
  Database,
  Key,
  FolderOpen,
  BarChart3,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { RoleModal } from '@/components/roles/RoleModal'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all')

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

  const getPermissionColor = (permission: string) => {
    if (permission.includes('*')) return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
    if (permission.includes('read')) return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
    if (permission.includes('write') || permission.includes('update')) return 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
    if (permission.includes('delete')) return 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
    return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white'
  }

  const getPermissionIcon = (permission: string) => {
    if (permission.includes('users')) return <Users size={12} />
    if (permission.includes('roles')) return <Shield size={12} />
    if (permission.includes('settings')) return <Settings size={12} />
    if (permission.includes('logs')) return <FileText size={12} />
    if (permission.includes('api')) return <Key size={12} />
    if (permission.includes('files')) return <FolderOpen size={12} />
    return <CheckCircle size={12} />
  }

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'system' && role.isSystem) ||
                         (filterType === 'custom' && !role.isSystem)
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    totalRoles: roles.length,
    systemRoles: roles.filter(r => r.isSystem).length,
    customRoles: roles.filter(r => !r.isSystem).length,
    totalUsers: roles.reduce((sum, role) => sum + role.userCount, 0),
    activeRoles: roles.filter(r => r.userCount > 0).length
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
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
      <PageHeader
        title="Rol Yönetimi"
        description="Sistem rollerini ve yetkilerini yönetin"
        icon={<Shield className="w-6 h-6" />}
        actions={
          <Button onClick={openCreateModal} className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
            <Plus size={16} className="mr-2" />
            Yeni Rol
          </Button>
        }
      />

      {/* İstatistikler */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatsCard
          title="Toplam Rol"
          value={stats.totalRoles}
          icon={<Shield className="w-5 h-5" />}
          gradient="from-blue-500 to-cyan-600"
          description="Sistemdeki tüm roller"
        />
        <StatsCard
          title="Sistem Rolleri"
          value={stats.systemRoles}
          icon={<Crown className="w-5 h-5" />}
          gradient="from-purple-500 to-pink-600"
          description="Varsayılan sistem rolleri"
        />
        <StatsCard
          title="Özel Roller"
          value={stats.customRoles}
          icon={<UserCheck className="w-5 h-5" />}
          gradient="from-green-500 to-emerald-600"
          description="Kullanıcı tarafından oluşturulan"
        />
        <StatsCard
          title="Toplam Kullanıcı"
          value={stats.totalUsers}
          icon={<Users className="w-5 h-5" />}
          gradient="from-orange-500 to-red-600"
          description="Rol atanmış kullanıcılar"
        />
        <StatsCard
          title="Aktif Roller"
          value={stats.activeRoles}
          icon={<CheckCircle className="w-5 h-5" />}
          gradient="from-teal-500 to-blue-600"
          description="Kullanıcısı olan roller"
        />
      </motion.div>

      {/* Filtreler ve Arama */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Rollerde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'system' | 'custom')}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">Tümü</option>
                <option value="system">Sistem Rolleri</option>
                <option value="custom">Özel Roller</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredRoles.length} rol bulundu
          </div>
        </div>
      </Card>

      {/* Ana İçerik */}
      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cards">Kart Görünümü</TabsTrigger>
          <TabsTrigger value="table">Tablo Görünümü</TabsTrigger>
          <TabsTrigger value="matrix">Yetki Matrisi</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredRoles.map((role, index) => (
              <motion.div
                key={role.id}
                variants={itemVariants}
                className="group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500">
                  <div className="p-6">
                    {/* Başlık */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-orange-600 text-white">
                          <Shield size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{role.displayName}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{role.name}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(role)}>
                            <Edit size={16} className="mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users size={16} className="mr-2" />
                            Kullanıcıları Görüntüle
                          </DropdownMenuItem>
                          {!role.isSystem && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Sil
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Açıklama */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {role.description || 'Açıklama bulunmuyor'}
                    </p>

                    {/* Etiketler */}
                    <div className="flex items-center space-x-2 mb-4">
                      {role.isSystem && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                          <Crown size={12} className="mr-1" />
                          Sistem
                        </Badge>
                      )}
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Users size={12} />
                        <span>{role.userCount} kullanıcı</span>
                      </Badge>
                    </div>

                    {/* Yetkiler */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Yetkiler</h4>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission, index) => (
                          <Badge
                            key={index}
                            className={`text-xs ${getPermissionColor(permission)} flex items-center space-x-1`}
                          >
                            {getPermissionIcon(permission)}
                            <span>{permission.split('.')[1] || permission}</span>
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} daha
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Alt Bilgi */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <CheckCircle size={12} className="text-green-600" />
                        <span>Aktif</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(role.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-medium">Rol</th>
                    <th className="text-left py-4 px-6 font-medium">Kullanıcılar</th>
                    <th className="text-left py-4 px-6 font-medium">Yetkiler</th>
                    <th className="text-left py-4 px-6 font-medium">Tür</th>
                    <th className="text-left py-4 px-6 font-medium">Oluşturulma</th>
                    <th className="text-right py-4 px-6 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium">{role.displayName}</div>
                          <div className="text-sm text-muted-foreground font-mono">{role.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Users size={16} className="text-muted-foreground" />
                          <span className="font-medium">{role.userCount}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 2).map((permission, index) => (
                            <Badge
                              key={index}
                              className={`text-xs ${getPermissionColor(permission)}`}
                            >
                              {permission.split('.')[1] || permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {role.isSystem ? (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                            <Crown size={12} className="mr-1" />
                            Sistem
                          </Badge>
                        ) : (
                          <Badge variant="outline">Özel</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(role.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(role)}
                          >
                            <Edit size={16} />
                          </Button>
                          {!role.isSystem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Yetki Matrisi</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Rollerin sahip olduğu yetkilerin detaylı görünümü
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Rol</th>
                      <th className="text-center py-3 px-4 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <Users size={16} />
                          <span>Kullanıcı</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <Shield size={16} />
                          <span>Rol</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <Settings size={16} />
                          <span>Ayar</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <FileText size={16} />
                          <span>Log</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <Key size={16} />
                          <span>API</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <div className="flex items-center justify-center space-x-1">
                          <FolderOpen size={16} />
                          <span>Dosya</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map((role) => (
                      <tr key={role.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center space-x-2">
                            <Shield size={16} className="text-blue-600" />
                            <span>{role.displayName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {role.permissions.some(p => p.includes('users')) ? (
                            <CheckCircle size={16} className="text-green-600 mx-auto" />
                          ) : (
                            <XCircle size={16} className="text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {role.permissions.some(p => p.includes('roles')) ? (
                            <CheckCircle size={16} className="text-green-600 mx-auto" />
                          ) : (
                            <XCircle size={16} className="text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {role.permissions.some(p => p.includes('settings')) ? (
                            <CheckCircle size={16} className="text-green-600 mx-auto" />
                          ) : (
                            <XCircle size={16} className="text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {role.permissions.some(p => p.includes('logs')) ? (
                            <CheckCircle size={16} className="text-green-600 mx-auto" />
                          ) : (
                            <XCircle size={16} className="text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {role.permissions.some(p => p.includes('api')) ? (
                            <CheckCircle size={16} className="text-green-600 mx-auto" />
                          ) : (
                            <XCircle size={16} className="text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {role.permissions.some(p => p.includes('files')) ? (
                            <CheckCircle size={16} className="text-green-600 mx-auto" />
                          ) : (
                            <XCircle size={16} className="text-red-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

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