"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
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
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
  Package,
  Star,
  Users,
  Building,
  Globe,
  Zap,
  Mail,
  Database,
  CreditCard,
  Shield,
  DollarSign,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Integration {
  id: string
  name: string
  description?: string
  category: string
  provider: string
  version: string
  isActive: boolean
  isPremium: boolean
  price?: number
  features?: string[]
  configSchema?: any
  documentationUrl?: string
  createdAt: string
  installations: Array<{
    id: string
    isActive: boolean
    config?: string
    tenant?: { id: string; name: string }
    user?: { id: string; name: string; email: string }
  }>
  _count: {
    installations: number
  }
}

export function IntegrationMarketplace() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('marketplace')
  const [filters, setFilters] = useState({
    category: 'all',
    isActive: 'all',
    isPremium: 'all',
  })

  const [newIntegration, setNewIntegration] = useState({
    name: '',
    description: '',
    category: 'COMMUNICATION',
    provider: '',
    version: '1.0.0',
    isActive: true,
    isPremium: false,
    price: 0,
    features: [] as string[],
    configSchema: '',
    documentationUrl: '',
  })

  const [installData, setInstallData] = useState({
    integrationId: '',
    tenantId: '',
    userId: '',
    config: '',
    isActive: true,
  })

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })

      const response = await fetch(`/api/integrations?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setIntegrations(data.integrations.map((integration: any) => ({
          ...integration,
          features: integration.features ? JSON.parse(integration.features) : [],
          configSchema: integration.configSchema ? JSON.parse(integration.configSchema) : null,
        })))
      } else {
        toast.error('Entegrasyonlar yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Entegrasyonlar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const handleCreateIntegration = async () => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIntegration,
          features: newIntegration.features.length > 0 ? newIntegration.features : null,
          configSchema: newIntegration.configSchema ? JSON.parse(newIntegration.configSchema) : null,
        }),
      })

      if (response.ok) {
        toast.success('Entegrasyon başarıyla oluşturuldu')
        setShowCreateModal(false)
        setNewIntegration({
          name: '',
          description: '',
          category: 'COMMUNICATION',
          provider: '',
          version: '1.0.0',
          isActive: true,
          isPremium: false,
          price: 0,
          features: [],
          configSchema: '',
          documentationUrl: '',
        })
        fetchIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Entegrasyon oluşturulurken hata oluştu')
      }
    } catch (error) {
      toast.error('Entegrasyon oluşturulurken hata oluştu')
    }
  }

  const handleInstallIntegration = async () => {
    try {
      const response = await fetch('/api/integrations/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...installData,
          config: installData.config ? JSON.parse(installData.config) : null,
        }),
      })

      if (response.ok) {
        toast.success('Entegrasyon başarıyla kuruldu')
        setShowInstallModal(false)
        setSelectedIntegration(null)
        setInstallData({
          integrationId: '',
          tenantId: '',
          userId: '',
          config: '',
          isActive: true,
        })
        fetchIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Entegrasyon kurulurken hata oluştu')
      }
    } catch (error) {
      toast.error('Entegrasyon kurulurken hata oluştu')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COMMUNICATION':
        return <Mail className="w-5 h-5 text-blue-500" />
      case 'PAYMENT':
        return <CreditCard className="w-5 h-5 text-green-500" />
      case 'DATABASE':
        return <Database className="w-5 h-5 text-purple-500" />
      case 'SECURITY':
        return <Shield className="w-5 h-5 text-red-500" />
      case 'ANALYTICS':
        return <Globe className="w-5 h-5 text-orange-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'COMMUNICATION':
        return 'İletişim'
      case 'PAYMENT':
        return 'Ödeme'
      case 'DATABASE':
        return 'Veritabanı'
      case 'SECURITY':
        return 'Güvenlik'
      case 'ANALYTICS':
        return 'Analitik'
      default:
        return category
    }
  }

  const getInstallationStatus = (integration: Integration) => {
    if (integration.installations.length === 0) {
      return { installed: false, status: 'NOT_INSTALLED' }
    }
    
    const activeInstallations = integration.installations.filter(inst => inst.isActive)
    if (activeInstallations.length > 0) {
      return { installed: true, status: 'ACTIVE' }
    }
    
    return { installed: true, status: 'INACTIVE' }
  }

  const addFeature = () => {
    setNewIntegration(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }

  const removeFeature = (index: number) => {
    setNewIntegration(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setNewIntegration(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature),
    }))
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'marketplace'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Pazaryeri
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'installed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Kurulu Entegrasyonlar
        </button>
      </div>

      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Entegrasyon Pazaryeri</h2>
              <p className="text-muted-foreground">
                Sisteminizi genişletmek için entegrasyonları keşfedin
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni Entegrasyon
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kategori</label>
                  <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm kategoriler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm kategoriler</SelectItem>
                      <SelectItem value="COMMUNICATION">İletişim</SelectItem>
                      <SelectItem value="PAYMENT">Ödeme</SelectItem>
                      <SelectItem value="DATABASE">Veritabanı</SelectItem>
                      <SelectItem value="SECURITY">Güvenlik</SelectItem>
                      <SelectItem value="ANALYTICS">Analitik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
              
              <Button onClick={fetchIntegrations} className="mt-4">
                Filtrele
              </Button>
            </CardContent>
          </Card>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              integrations.map((integration) => {
                const { installed, status } = getInstallationStatus(integration)
                
                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(integration.category)}
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {integration.isPremium && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Premium
                              </Badge>
                            )}
                            <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                              {integration.isActive ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {integration.description || 'Açıklama yok'}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Sağlayıcı
                            </span>
                            <span>{integration.provider}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Kategori
                            </span>
                            <span>{getCategoryName(integration.category)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Settings className="w-3 h-3" />
                              Versiyon
                            </span>
                            <span>{integration.version}</span>
                          </div>
                          
                          {integration.isPremium && integration.price && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Fiyat
                              </span>
                              <span>${integration.price}/ay</span>
                            </div>
                          )}
                        </div>
                        
                        {integration.features && integration.features.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Özellikler:</p>
                            <div className="space-y-1">
                              {integration.features.slice(0, 3).map((feature, index) => (
                                <p key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {feature}
                                </p>
                              ))}
                              {integration.features.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{integration.features.length - 3} daha...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {integration._count.installations} kurulum
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(integration.createdAt), 'dd/MM/yyyy', { locale: tr })}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          {!installed ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedIntegration(integration)
                                setInstallData(prev => ({ ...prev, integrationId: integration.id }))
                                setShowInstallModal(true)
                              }}
                              className="flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Kur
                            </Button>
                          ) : (
                            <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {status === 'ACTIVE' ? 'Kurulu' : 'Devre Dışı'}
                            </Badge>
                          )}
                          
                          {integration.documentationUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(integration.documentationUrl, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Dokümantasyon
                            </Button>
                          )}
                          
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            Detaylar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'installed' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Kurulu Entegrasyonlar</h2>
            <p className="text-muted-foreground">
              Sisteminizde kurulu olan entegrasyonları yönetin
            </p>
          </div>

          <div className="space-y-4">
            {integrations
              .filter(integration => integration.installations.length > 0)
              .map((integration) => (
                <Card key={integration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getCategoryIcon(integration.category)}
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {integration.provider} • {getCategoryName(integration.category)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          {integration.installations.length} kurulum
                        </Badge>
                        <Button variant="outline" size="sm">
                          Yönet
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Create Integration Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Entegrasyon Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Entegrasyon Adı</label>
                <Input
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Entegrasyon adı"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Sağlayıcı</label>
                <Input
                  value={newIntegration.provider}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="Sağlayıcı adı"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <Textarea
                value={newIntegration.description}
                onChange={(e) => setNewIntegration(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Entegrasyon açıklaması..."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kategori</label>
                <Select value={newIntegration.category} onValueChange={(value) => setNewIntegration(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMUNICATION">İletişim</SelectItem>
                    <SelectItem value="PAYMENT">Ödeme</SelectItem>
                    <SelectItem value="DATABASE">Veritabanı</SelectItem>
                    <SelectItem value="SECURITY">Güvenlik</SelectItem>
                    <SelectItem value="ANALYTICS">Analitik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Versiyon</label>
                <Input
                  value={newIntegration.version}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Fiyat (Premium)</label>
                <Input
                  type="number"
                  value={newIntegration.price}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dokümantasyon URL</label>
                <Input
                  value={newIntegration.documentationUrl}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, documentationUrl: e.target.value }))}
                  placeholder="https://docs.example.com"
                />
              </div>
              
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newIntegration.isPremium}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, isPremium: e.target.checked }))}
                  />
                  <span className="text-sm">Premium</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newIntegration.isActive}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span className="text-sm">Aktif</span>
                </label>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Özellikler</label>
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="w-4 h-4" />
                  Özellik Ekle
                </Button>
              </div>
              
              <div className="space-y-2">
                {newIntegration.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Özellik açıklaması"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Konfigürasyon Şeması (JSON)</label>
              <Textarea
                value={newIntegration.configSchema}
                onChange={(e) => setNewIntegration(prev => ({ ...prev, configSchema: e.target.value }))}
                placeholder='{"apiKey": {"type": "string", "required": true}}'
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateIntegration}>
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Install Integration Modal */}
      <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Entegrasyon Kur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedIntegration && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedIntegration.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIntegration.description}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Konfigürasyon (JSON)</label>
              <Textarea
                value={installData.config}
                onChange={(e) => setInstallData(prev => ({ ...prev, config: e.target.value }))}
                placeholder='{"apiKey": "your-api-key", "endpoint": "https://api.example.com"}'
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={installData.isActive}
                onChange={(e) => setInstallData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <span className="text-sm">Kurulum sonrası aktif et</span>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInstallModal(false)}>
                İptal
              </Button>
              <Button onClick={handleInstallIntegration}>
                Kur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 