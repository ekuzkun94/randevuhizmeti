"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId?: string
  userId?: string
  oldValues?: any
  newValues?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
  }
}

interface AuditStats {
  totalLogs: number
  todayLogs: number
  actionStats: Array<{
    action: string
    count: number
  }>
}

export function AuditTrailManager() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: 'all',
    entityType: 'all',
    entityId: '',
    userId: '',
    startDate: '',
    endDate: '',
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })

      const response = await fetch(`/api/audit?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setLogs(data.logs)
      } else {
        toast.error('Audit logları yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Audit logları yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit/stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    fetchLogs()
  }

  const handleReset = () => {
    setFilters({
      action: 'all',
      entityType: 'all',
      entityId: '',
      userId: '',
      startDate: '',
      endDate: '',
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'UPDATE':
        return <RefreshCw className="w-4 h-4 text-blue-500" />
      case 'DELETE':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'LOGIN':
        return <User className="w-4 h-4 text-green-500" />
      case 'LOGOUT':
        return <User className="w-4 h-4 text-gray-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success'
      case 'UPDATE':
        return 'default'
      case 'DELETE':
        return 'destructive'
      case 'LOGIN':
        return 'success'
      case 'LOGOUT':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Tarih', 'İşlem', 'Varlık Tipi', 'Varlık ID', 'Kullanıcı', 'IP Adresi'],
      ...logs.map(log => [
        format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: tr }),
        log.action,
        log.entityType,
        log.entityId || '',
        log.user?.name || log.user?.email || '',
        log.ipAddress || '',
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Log</p>
                  <p className="text-2xl font-bold">{stats.totalLogs}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bugünkü Log</p>
                  <p className="text-2xl font-bold">{stats.todayLogs}</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Çok İşlem</p>
                  <p className="text-lg font-semibold">
                    {stats.actionStats[0]?.action || 'N/A'}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">İşlem Türleri</p>
                  <p className="text-2xl font-bold">{stats.actionStats.length}</p>
                </div>
                <Filter className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">İşlem Türü</label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="İşlem türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm işlemler</SelectItem>
                  <SelectItem value="CREATE">Oluşturma</SelectItem>
                  <SelectItem value="UPDATE">Güncelleme</SelectItem>
                  <SelectItem value="DELETE">Silme</SelectItem>
                  <SelectItem value="LOGIN">Giriş</SelectItem>
                  <SelectItem value="LOGOUT">Çıkış</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Varlık Tipi</label>
              <Select value={filters.entityType} onValueChange={(value) => handleFilterChange('entityType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Varlık türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm varlıklar</SelectItem>
                  <SelectItem value="User">Kullanıcı</SelectItem>
                  <SelectItem value="File">Dosya</SelectItem>
                  <SelectItem value="ApiKey">API Anahtarı</SelectItem>
                  <SelectItem value="Notification">Bildirim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Başlangıç Tarihi</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Ara
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Sıfırla
            </Button>
            <Button variant="outline" onClick={exportLogs} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Dışa Aktar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Audit Logları
            </span>
            <Button variant="outline" size="sm" onClick={fetchLogs} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Yenile
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLog(log)
                    setShowDetails(true)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(log.action) as any}>
                            {log.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.entityType}
                          </span>
                          {log.entityId && (
                            <span className="text-sm text-muted-foreground">
                              #{log.entityId.slice(-8)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.user?.name || log.user?.email || 'Sistem'}
                          {log.ipAddress && ` • ${log.ipAddress}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: tr })}
                      </span>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Log bulunamadı
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Log Detayları</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(false)}
              >
                Kapat
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">İşlem</label>
                  <Badge variant={getActionBadgeVariant(selectedLog.action) as any}>
                    {selectedLog.action}
                  </Badge>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Varlık Tipi</label>
                  <p className="text-sm">{selectedLog.entityType}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Varlık ID</label>
                  <p className="text-sm font-mono">{selectedLog.entityId || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Kullanıcı</label>
                  <p className="text-sm">{selectedLog.user?.name || selectedLog.user?.email || 'Sistem'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">IP Adresi</label>
                  <p className="text-sm font-mono">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tarih</label>
                  <p className="text-sm">
                    {format(new Date(selectedLog.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: tr })}
                  </p>
                </div>
              </div>
              
              {selectedLog.oldValues && (
                <div>
                  <label className="block text-sm font-medium mb-1">Eski Değerler</label>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.newValues && (
                <div>
                  <label className="block text-sm font-medium mb-1">Yeni Değerler</label>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.metadata && (
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Veri</label>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 