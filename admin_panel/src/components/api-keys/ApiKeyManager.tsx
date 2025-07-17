'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff,
  Edit, 
  Trash2, 
  RefreshCw,
  Calendar,
  Clock
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard, gradientPresets } from '@/components/ui/StatsCard'

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string
  lastUsed?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFullKey, setShowFullKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState<{
    name: string
    permissions: string[]
    expiresAt: string
  }>({
    name: '',
    permissions: [],
    expiresAt: ''
  })

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/api-keys')
      const data = await response.json()

      if (response.ok) {
        setApiKeys(data.apiKeys)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
      toast.error('API anahtarları yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApiKey)
      })

      if (response.ok) {
        const createdKey = await response.json()
        toast.success('API anahtarı başarıyla oluşturuldu')
        setIsModalOpen(false)
        setNewApiKey({ name: '', permissions: [], expiresAt: '' })
        fetchApiKeys()
        
        // Yeni oluşturulan key'i göster
        setShowFullKey(createdKey.id)
      } else {
        const error = await response.json()
        toast.error(error.error || 'API anahtarı oluşturulurken hata oluştu')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error('API anahtarı oluşturulurken hata oluştu')
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Bu API anahtarını silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.id !== id))
        toast.success('API anahtarı silindi')
      } else {
        const error = await response.json()
        toast.error(error.error || 'API anahtarı silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('API anahtarı silinirken hata oluştu')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('API anahtarı panoya kopyalandı')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Kopyalama işlemi başarısız')
    }
  }

  const getStatusBadge = (isActive: boolean, expiresAt?: string) => {
    if (!isActive) {
      return <Badge variant="destructive">Pasif</Badge>
    }
    
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return <Badge variant="destructive">Süresi Dolmuş</Badge>
    }
    
    return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
  }

  // Stats
  const total = apiKeys.length
  const active = apiKeys.filter(k => k.isActive && (!k.expiresAt || new Date(k.expiresAt) > new Date())).length
  const expired = apiKeys.filter(k => k.expiresAt && new Date(k.expiresAt) < new Date()).length
  const passive = apiKeys.filter(k => !k.isActive).length

  const statsCards = [
    {
      title: 'Toplam Anahtar',
      value: total,
      icon: <Key className="h-6 w-6" />, 
      gradient: gradientPresets.blue,
      change: { value: 0, type: 'neutral', period: '' }
    },
    {
      title: 'Aktif',
      value: active,
      icon: <Key className="h-6 w-6" />, 
      gradient: gradientPresets.green,
      change: { value: 0, type: 'neutral', period: '' }
    },
    {
      title: 'Pasif',
      value: passive,
      icon: <Key className="h-6 w-6" />, 
      gradient: gradientPresets.red,
      change: { value: 0, type: 'neutral', period: '' }
    },
    {
      title: 'Süresi Dolmuş',
      value: expired,
      icon: <Clock className="h-6 w-6" />, 
      gradient: gradientPresets.orange,
      change: { value: 0, type: 'neutral', period: '' }
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="API Anahtarları"
        description="API erişimi için anahtarlarınızı yönetin"
        icon={<Key className="h-8 w-8" />}
        gradient="from-blue-600 via-purple-600 to-pink-600"
        stats={statsCards}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={fetchApiKeys}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Yeni API Anahtarı</span>
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'API Anahtarları' }
        ]}
      />

      {/* API Keys Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apiKeys.map((apiKey, index) => (
          <motion.div
            key={apiKey.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                  {getStatusBadge(apiKey.isActive, apiKey.expiresAt)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">API Anahtarı</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={showFullKey === apiKey.id ? apiKey.key : apiKey.key}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullKey(showFullKey === apiKey.id ? null : apiKey.id)}
                    >
                      {showFullKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Oluşturulma:</span>
                  <span>{format(new Date(apiKey.createdAt), 'dd MMM yyyy', { locale: tr })}</span>
                </div>

                {apiKey.lastUsed && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Son Kullanım:</span>
                    <span>{format(new Date(apiKey.lastUsed), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                  </div>
                )}

                {apiKey.expiresAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Bitiş Tarihi:</span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(apiKey.expiresAt), 'dd MMM yyyy', { locale: tr })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="text-xs">
                    {JSON.parse(apiKey.permissions).length} İzin
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {apiKeys.length === 0 && (
        <div className="text-center py-12">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            API anahtarı bulunamadı
          </h3>
          <p className="text-gray-500 mb-4">
            İlk API anahtarınızı oluşturmak için yukarıdaki butona tıklayın
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk API Anahtarını Oluştur
          </Button>
        </div>
      )}

      {/* Create API Key Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yeni API Anahtarı Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Anahtar Adı</label>
              <Input
                value={newApiKey.name}
                onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                placeholder="Örn: Mobil Uygulama"
              />
            </div>

            <div>
              <label className="text-sm font-medium">İzinler</label>
              <Select
                value={newApiKey.permissions[0] || ''}
                onValueChange={(value) => setNewApiKey({ ...newApiKey, permissions: [value] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İzin seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Sadece Okuma</SelectItem>
                  <SelectItem value="write">Okuma ve Yazma</SelectItem>
                  <SelectItem value="admin">Tam Erişim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Bitiş Tarihi (Opsiyonel)</label>
              <Input
                type="datetime-local"
                value={newApiKey.expiresAt}
                onChange={(e) => setNewApiKey({ ...newApiKey, expiresAt: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={createApiKey} disabled={!newApiKey.name}>
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 