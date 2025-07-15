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
  History,
  RotateCcw,
  GitCompare,
  FileText,
  User,
  Settings,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface VersionedData {
  id: string
  entityType: string
  entityId: string
  version: number
  data: any
  authorId: string
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
  changeReason?: string
  createdAt: Date
  author?: {
    id: string
    name: string
    email: string
  }
}

interface VersionStats {
  totalVersions: number
  totalEntities: number
  versionsByType: Record<string, number>
  recentChanges: VersionedData[]
}

export function VersionManager() {
  const [versions, setVersions] = useState<VersionedData[]>([])
  const [stats, setStats] = useState<VersionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<VersionedData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'versions'>('overview')
  const [filters, setFilters] = useState({
    entityType: '',
    entityId: '',
  })

  const [restoreData, setRestoreData] = useState({
    entityType: '',
    entityId: '',
    version: 0,
    changeReason: '',
  })

  const [compareData, setCompareData] = useState({
    entityType: '',
    entityId: '',
    version1: 0,
    version2: 0,
  })

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/versions')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      } else {
        toast.error('İstatistikler yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('İstatistikler yüklenirken hata oluştu')
    }
  }

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/versions?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setVersions(data.versions || [])
      } else {
        toast.error('Versiyonlar yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Versiyonlar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats()
    } else {
      fetchVersions()
    }
  }, [activeTab, filters])

  const handleRestore = async () => {
    try {
      const response = await fetch('/api/versions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoreData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        setShowRestoreModal(false)
        setRestoreData({
          entityType: '',
          entityId: '',
          version: 0,
          changeReason: '',
        })
        fetchVersions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Geri yükleme başarısız')
      }
    } catch (error) {
      toast.error('Geri yükleme başarısız')
    }
  }

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'CREATE':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'UPDATE':
        return <ArrowRight className="w-4 h-4 text-blue-500" />
      case 'DELETE':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'RESTORE':
        return <RotateCcw className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'CREATE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Oluşturuldu</Badge>
      case 'UPDATE':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Güncellendi</Badge>
      case 'DELETE':
        return <Badge variant="destructive">Silindi</Badge>
      case 'RESTORE':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Geri Yüklendi</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
  }

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'USER':
        return <User className="w-4 h-4" />
      case 'SETTING':
        return <Settings className="w-4 h-4" />
      case 'CONTENT':
        return <FileText className="w-4 h-4" />
      case 'MODULE':
        return <Package className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getEntityTypeName = (entityType: string) => {
    switch (entityType) {
      case 'USER':
        return 'Kullanıcı'
      case 'SETTING':
        return 'Ayar'
      case 'CONTENT':
        return 'İçerik'
      case 'MODULE':
        return 'Modül'
      default:
        return entityType
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Genel Bakış
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'versions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Versiyonlar
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">Versiyon Yönetimi</h2>
            <p className="text-muted-foreground">
              Sistem kayıtlarının versiyon geçmişini görüntüleyin ve yönetin
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam Versiyon</p>
                      <p className="text-2xl font-bold">{stats.totalVersions}</p>
                    </div>
                    <History className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam Varlık</p>
                      <p className="text-2xl font-bold">{stats.totalEntities}</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Varlık Türleri</p>
                      <p className="text-2xl font-bold">{Object.keys(stats.versionsByType).length}</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Son Değişiklikler</p>
                      <p className="text-2xl font-bold">{stats.recentChanges.length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Versions by Type */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Varlık Türlerine Göre Versiyonlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.versionsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getEntityTypeIcon(type)}
                        <span className="font-medium">{getEntityTypeName(type)}</span>
                      </div>
                      <Badge variant="outline">{count} versiyon</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Changes */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Son Değişiklikler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentChanges.map((change) => (
                    <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getChangeTypeIcon(change.changeType)}
                        <div>
                          <p className="font-medium">
                            {getEntityTypeName(change.entityType)} - {change.entityId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Versiyon {change.version} • {change.author?.name || 'Bilinmeyen'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getChangeTypeBadge(change.changeType)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(change.createdAt), 'dd/MM HH:mm', { locale: tr })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">Versiyon Geçmişi</h2>
            <p className="text-muted-foreground">
              Belirli varlıkların versiyon geçmişini görüntüleyin
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Varlık Türü</label>
                  <Select value={filters.entityType} onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm türler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm türler</SelectItem>
                      <SelectItem value="USER">Kullanıcı</SelectItem>
                      <SelectItem value="SETTING">Ayar</SelectItem>
                      <SelectItem value="CONTENT">İçerik</SelectItem>
                      <SelectItem value="MODULE">Modül</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Varlık ID</label>
                  <Input
                    value={filters.entityId}
                    onChange={(e) => setFilters(prev => ({ ...prev, entityId: e.target.value }))}
                    placeholder="Varlık ID'si"
                  />
                </div>
              </div>
              
              <Button onClick={fetchVersions} className="mt-4">
                Filtrele
              </Button>
            </CardContent>
          </Card>

          {/* Versions List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              versions.map((version) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            {getChangeTypeIcon(version.changeType)}
                            <h3 className="font-semibold">
                              {getEntityTypeName(version.entityType)} - {version.entityId}
                            </h3>
                            {getChangeTypeBadge(version.changeType)}
                            <Badge variant="outline">v{version.version}</Badge>
                          </div>
                          
                          {version.changeReason && (
                            <p className="text-sm text-muted-foreground">
                              {version.changeReason}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {version.author?.name || 'Bilinmeyen'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(version.createdAt), 'dd/MM/yyyy HH:mm', { locale: tr })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVersion(version)
                              setRestoreData(prev => ({
                                ...prev,
                                entityType: version.entityType,
                                entityId: version.entityId,
                                version: version.version,
                              }))
                              setShowRestoreModal(true)
                            }}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Geri Yükle
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <GitCompare className="w-3 h-3" />
                            Karşılaştır
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Restore Modal */}
      <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Versiyon Geri Yükle</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Geri Yükleme Nedeni</label>
              <Textarea
                value={restoreData.changeReason}
                onChange={(e) => setRestoreData(prev => ({ ...prev, changeReason: e.target.value }))}
                placeholder="Geri yükleme nedenini belirtin..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRestoreModal(false)}>
                İptal
              </Button>
              <Button onClick={handleRestore}>
                Geri Yükle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 