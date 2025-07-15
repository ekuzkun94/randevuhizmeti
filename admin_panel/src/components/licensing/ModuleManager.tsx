"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import {
  Plus,
  Edit,
  Trash2,
  Key,
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Settings,
  Users,
  Building,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Module {
  id: string
  name: string
  displayName: string
  description?: string
  version: string
  isActive: boolean
  isPremium: boolean
  price?: number
  features?: string[]
  createdAt: string
  licenses: Array<{
    id: string
    isActive: boolean
    expiresAt?: string
    tenant?: { id: string; name: string }
    user?: { id: string; name: string; email: string }
  }>
}

interface LicenseStats {
  totalLicenses: number
  activeLicenses: number
  expiredLicenses: number
  premiumModules: number
  freeModules: number
}

export function ModuleManager() {
  const [modules, setModules] = useState<Module[]>([])
  const [stats, setStats] = useState<LicenseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [filters, setFilters] = useState({
    isActive: 'all',
    isPremium: 'all',
  })

  const [newModule, setNewModule] = useState({
    name: '',
    displayName: '',
    description: '',
    version: '1.0.0',
    isActive: true,
    isPremium: false,
    price: 0,
    features: [] as string[],
  })

  const [newLicense, setNewLicense] = useState({
    moduleId: '',
    tenantId: '',
    userId: '',
    isActive: true,
    expiresAt: '',
    features: [] as string[],
  })

  const fetchModules = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })

      const response = await fetch(`/api/modules?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setModules(data.modules.map((module: any) => ({
          ...module,
          features: module.features ? JSON.parse(module.features) : [],
        })))
      } else {
        toast.error('Modüller yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Modüller yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/licenses/stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }

  useEffect(() => {
    fetchModules()
    fetchStats()
  }, [])

  const handleCreateModule = async () => {
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModule),
      })

      if (response.ok) {
        toast.success('Modül başarıyla oluşturuldu')
        setShowCreateModal(false)
        setNewModule({
          name: '',
          displayName: '',
          description: '',
          version: '1.0.0',
          isActive: true,
          isPremium: false,
          price: 0,
          features: [],
        })
        fetchModules()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Modül oluşturulurken hata oluştu')
      }
    } catch (error) {
      toast.error('Modül oluşturulurken hata oluştu')
    }
  }

  const handleCreateLicense = async () => {
    try {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLicense,
          tenantId: newLicense.tenantId || undefined,
          userId: newLicense.userId || undefined,
          expiresAt: newLicense.expiresAt || undefined,
        }),
      })

      if (response.ok) {
        toast.success('Lisans başarıyla oluşturuldu')
        setShowLicenseModal(false)
        setNewLicense({
          moduleId: '',
          tenantId: '',
          userId: '',
          isActive: true,
          expiresAt: '',
          features: [],
        })
        fetchModules()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Lisans oluşturulurken hata oluştu')
      }
    } catch (error) {
      toast.error('Lisans oluşturulurken hata oluştu')
    }
  }

  const getModuleIcon = (module: Module) => {
    if (module.isPremium) return <Crown className="w-5 h-5 text-yellow-500" />
    return <Package className="w-5 h-5 text-blue-500" />
  }

  const getLicenseCount = (module: Module) => {
    return module.licenses.length
  }

  const getActiveLicenseCount = (module: Module) => {
    return module.licenses.filter(license => license.isActive).length
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Lisans</p>
                  <p className="text-2xl font-bold">{stats.totalLicenses}</p>
                </div>
                <Key className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktif Lisans</p>
                  <p className="text-2xl font-bold">{stats.activeLicenses}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Süresi Dolmuş</p>
                  <p className="text-2xl font-bold">{stats.expiredLicenses}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Premium Modül</p>
                  <p className="text-2xl font-bold">{stats.premiumModules}</p>
                </div>
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ücretsiz Modül</p>
                  <p className="text-2xl font-bold">{stats.freeModules}</p>
                </div>
                <Package className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Modül Yönetimi
            </span>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni Modül
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Durum</label>
              <Select value={filters.isActive} onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm durumlar</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Tür</label>
              <Select value={filters.isPremium} onValueChange={(value) => setFilters(prev => ({ ...prev, isPremium: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm türler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm türler</SelectItem>
                  <SelectItem value="true">Premium</SelectItem>
                  <SelectItem value="false">Ücretsiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={fetchModules} className="flex items-center gap-2">
            Filtrele
          </Button>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          modules.map((module) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getModuleIcon(module)}
                      <CardTitle className="text-lg">{module.displayName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {module.isPremium && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Premium
                        </Badge>
                      )}
                      <Badge variant={module.isActive ? 'default' : 'secondary'}>
                        {module.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {module.description || 'Açıklama yok'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Versiyon: {module.version}</span>
                    {module.isPremium && module.price && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {module.price}/ay
                      </span>
                    )}
                  </div>
                  
                  {module.features && module.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Özellikler:</p>
                      <div className="space-y-1">
                        {module.features.slice(0, 3).map((feature, index) => (
                          <p key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {feature}
                          </p>
                        ))}
                        {module.features.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{module.features.length - 3} daha...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      {getActiveLicenseCount(module)}/{getLicenseCount(module)} aktif lisans
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(module.createdAt), 'dd/MM/yyyy', { locale: tr })}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedModule(module)
                        setNewLicense(prev => ({ ...prev, moduleId: module.id }))
                        setShowLicenseModal(true)
                      }}
                      className="flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      Lisans Ekle
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Edit className="w-3 h-3" />
                      Düzenle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Module Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Modül Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Modül Adı</label>
                <Input
                  value={newModule.name}
                  onChange={(e) => setNewModule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="modul-adi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Görünen Ad</label>
                <Input
                  value={newModule.displayName}
                  onChange={(e) => setNewModule(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Modül Adı"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <Input
                value={newModule.description}
                onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Modül açıklaması..."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Versiyon</label>
                <Input
                  value={newModule.version}
                  onChange={(e) => setNewModule(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Fiyat (Premium)</label>
                <Input
                  type="number"
                  value={newModule.price}
                  onChange={(e) => setNewModule(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newModule.isPremium}
                    onChange={(e) => setNewModule(prev => ({ ...prev, isPremium: e.target.checked }))}
                  />
                  <span className="text-sm">Premium Modül</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateModule}>
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create License Modal */}
      <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lisans Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Modül</label>
              <Select value={newLicense.moduleId} onValueChange={(value) => setNewLicense(prev => ({ ...prev, moduleId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Modül seçin" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(module => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Bitiş Tarihi (Opsiyonel)</label>
              <Input
                type="date"
                value={newLicense.expiresAt}
                onChange={(e) => setNewLicense(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLicenseModal(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateLicense}>
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 