import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default async function RolesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const roles = [
    {
      id: 1,
      name: 'SUPER_ADMIN',
      displayName: 'Süper Admin',
      description: 'Tam sistem yöneticisi, tüm yetkilere sahip',
      userCount: 1,
      permissions: ['users.*', 'settings.*', 'logs.*', 'api.*', 'files.*'],
      isSystem: true,
    },
    {
      id: 2,
      name: 'ADMIN',
      displayName: 'Admin',
      description: 'Sistem yöneticisi, çoğu yetkiye sahip',
      userCount: 3,
      permissions: ['users.read', 'users.update', 'settings.read', 'logs.read'],
      isSystem: true,
    },
    {
      id: 3,
      name: 'EDITOR',
      displayName: 'Editör',
      description: 'İçerik editörü, sınırlı yetkilere sahip',
      userCount: 8,
      permissions: ['content.*', 'files.read', 'files.upload'],
      isSystem: false,
    },
    {
      id: 4,
      name: 'USER',
      displayName: 'Kullanıcı',
      description: 'Standart kullanıcı, temel yetkilere sahip',
      userCount: 45,
      permissions: ['profile.*', 'files.read'],
      isSystem: true,
    },
  ]

  const getPermissionColor = (permission: string) => {
    if (permission.includes('*')) return 'text-green-600 bg-green-100'
    if (permission.includes('read')) return 'text-blue-600 bg-blue-100'
    if (permission.includes('write') || permission.includes('update')) return 'text-yellow-600 bg-yellow-100'
    if (permission.includes('delete')) return 'text-red-600 bg-red-100'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rol Yönetimi</h1>
          <p className="text-muted-foreground">Sistem rollerini ve yetkilerini yönetin</p>
        </div>
        <Button>
          <Plus size={16} className="mr-2" />
          Yeni Rol
        </Button>
      </div>

      {/* Roller Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
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
                    <Button variant="ghost" size="sm">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Users size={16} />
                    </Button>
                    {!role.isSystem && (
                      <Button variant="ghost" size="sm">
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
                  <th className="text-left py-3 px-4 font-medium">Ayarlar</th>
                  <th className="text-left py-3 px-4 font-medium">Loglar</th>
                  <th className="text-left py-3 px-4 font-medium">API</th>
                  <th className="text-left py-3 px-4 font-medium">Dosyalar</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
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
    </div>
  )
} 