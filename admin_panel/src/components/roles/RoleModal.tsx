'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { X, Plus, Trash2 } from 'lucide-react'

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id?: string
  name: string
  displayName: string
  description: string
  permissions: string[]
  isSystem?: boolean
}

interface RoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (role: Omit<Role, 'id'>) => void
  role?: Role | null
  mode: 'create' | 'edit'
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Kullanıcı Yönetimi
  { id: 'users.read', name: 'Kullanıcıları Görüntüle', description: 'Kullanıcı listesini görüntüleme', category: 'Kullanıcı Yönetimi' },
  { id: 'users.create', name: 'Kullanıcı Oluştur', description: 'Yeni kullanıcı oluşturma', category: 'Kullanıcı Yönetimi' },
  { id: 'users.update', name: 'Kullanıcı Düzenle', description: 'Kullanıcı bilgilerini düzenleme', category: 'Kullanıcı Yönetimi' },
  { id: 'users.delete', name: 'Kullanıcı Sil', description: 'Kullanıcı silme', category: 'Kullanıcı Yönetimi' },
  { id: 'users.*', name: 'Tüm Kullanıcı İşlemleri', description: 'Kullanıcı yönetiminde tam yetki', category: 'Kullanıcı Yönetimi' },
  
  // Rol Yönetimi
  { id: 'roles.read', name: 'Rolleri Görüntüle', description: 'Rol listesini görüntüleme', category: 'Rol Yönetimi' },
  { id: 'roles.create', name: 'Rol Oluştur', description: 'Yeni rol oluşturma', category: 'Rol Yönetimi' },
  { id: 'roles.update', name: 'Rol Düzenle', description: 'Rol bilgilerini düzenleme', category: 'Rol Yönetimi' },
  { id: 'roles.delete', name: 'Rol Sil', description: 'Rol silme', category: 'Rol Yönetimi' },
  { id: 'roles.*', name: 'Tüm Rol İşlemleri', description: 'Rol yönetiminde tam yetki', category: 'Rol Yönetimi' },
  
  // Sistem Ayarları
  { id: 'settings.read', name: 'Ayarları Görüntüle', description: 'Sistem ayarlarını görüntüleme', category: 'Sistem Ayarları' },
  { id: 'settings.update', name: 'Ayarları Düzenle', description: 'Sistem ayarlarını düzenleme', category: 'Sistem Ayarları' },
  { id: 'settings.*', name: 'Tüm Ayar İşlemleri', description: 'Sistem ayarlarında tam yetki', category: 'Sistem Ayarları' },
  
  // Loglar
  { id: 'logs.read', name: 'Logları Görüntüle', description: 'Sistem loglarını görüntüleme', category: 'Loglar' },
  { id: 'logs.export', name: 'Logları Dışa Aktar', description: 'Sistem loglarını dışa aktarma', category: 'Loglar' },
  { id: 'logs.*', name: 'Tüm Log İşlemleri', description: 'Log yönetiminde tam yetki', category: 'Loglar' },
  
  // API Yönetimi
  { id: 'api.read', name: 'API Anahtarlarını Görüntüle', description: 'API anahtarlarını görüntüleme', category: 'API Yönetimi' },
  { id: 'api.create', name: 'API Anahtarı Oluştur', description: 'Yeni API anahtarı oluşturma', category: 'API Yönetimi' },
  { id: 'api.delete', name: 'API Anahtarı Sil', description: 'API anahtarı silme', category: 'API Yönetimi' },
  { id: 'api.*', name: 'Tüm API İşlemleri', description: 'API yönetiminde tam yetki', category: 'API Yönetimi' },
  
  // Dosya Yönetimi
  { id: 'files.read', name: 'Dosyaları Görüntüle', description: 'Dosyaları görüntüleme', category: 'Dosya Yönetimi' },
  { id: 'files.upload', name: 'Dosya Yükle', description: 'Dosya yükleme', category: 'Dosya Yönetimi' },
  { id: 'files.delete', name: 'Dosya Sil', description: 'Dosya silme', category: 'Dosya Yönetimi' },
  { id: 'files.*', name: 'Tüm Dosya İşlemleri', description: 'Dosya yönetiminde tam yetki', category: 'Dosya Yönetimi' },
]

export function RoleModal({ isOpen, onClose, onSubmit, role, mode }: RoleModalProps) {
  const [formData, setFormData] = useState<Role>({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    isSystem: false
  })
  const [loading, setLoading] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  useEffect(() => {
    if (role && mode === 'edit') {
      setFormData(role)
      setSelectedPermissions(role.permissions)
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: [],
        isSystem: false
      })
      setSelectedPermissions([])
    }
  }, [role, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = { ...formData, permissions: selectedPermissions }
      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(p => p !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
  }

  const selectAllPermissions = (category: string) => {
    const categoryPermissions = AVAILABLE_PERMISSIONS
      .filter(p => p.category === category)
      .map(p => p.id)
    
    setSelectedPermissions(prev => {
      const hasAll = categoryPermissions.every(p => prev.includes(p))
      if (hasAll) {
        return prev.filter(p => !categoryPermissions.includes(p))
      } else {
        return [...new Set([...prev, ...categoryPermissions])]
      }
    })
  }

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {mode === 'create' ? 'Yeni Rol Oluştur' : 'Rol Düzenle'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Temel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rol Kodu</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    placeholder="ADMIN"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Görünen Ad</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Sistem Yöneticisi"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Rolün açıklaması..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isSystem"
                  checked={formData.isSystem}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSystem: checked })}
                />
                <Label htmlFor="isSystem">Sistem Rolü</Label>
              </div>

              {/* Yetkiler */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Yetkiler</Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedPermissions.length} yetki seçildi
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{category}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllPermissions(category)}
                        >
                          {permissions.every(p => selectedPermissions.includes(p.id)) ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                              selectedPermissions.includes(permission.id)
                                ? 'bg-primary/10 border-primary'
                                : 'bg-background border-border hover:bg-muted'
                            }`}
                            onClick={() => togglePermission(permission.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.id)}
                              onChange={() => {}}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{permission.name}</div>
                              <div className="text-xs text-muted-foreground">{permission.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seçili Yetkiler Özeti */}
              {selectedPermissions.length > 0 && (
                <div className="space-y-2">
                  <Label>Seçili Yetkiler</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedPermissions.map((permissionId) => {
                      const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId)
                      return (
                        <Badge key={permissionId} variant="secondary" className="text-xs">
                          {permission?.name || permissionId}
                          <button
                            type="button"
                            onClick={() => togglePermission(permissionId)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : mode === 'create' ? 'Oluştur' : 'Güncelle'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
} 