'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  Search, 
  Download, 
  Filter,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity
} from 'lucide-react'
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

interface LogItem {
  id: string
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'
  type: 'SYSTEM' | 'USER' | 'SECURITY' | 'API'
  message: string
  details?: string
  metadata?: any
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
  }
}

export function LogManager() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [level, setLevel] = useState('')
  const [type, setType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        level,
        type,
        startDate,
        endDate
      })

      const response = await fetch(`/api/logs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Loglar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, search, level, type, startDate, endDate])

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        level,
        type,
        startDate,
        endDate
      })

      const response = await fetch(`/api/logs/export?${params}`)
      
      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `logs-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
        toast.success(`${format.toUpperCase()} formatında loglar indirildi`)
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast.error('Log export işlemi başarısız')
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'DEBUG':
        return <Activity className="h-4 w-4 text-gray-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SECURITY':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'API':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'USER':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'SYSTEM':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Yönetimi</h1>
          <p className="text-muted-foreground">
            Sistem ve kullanıcı aktivite loglarını görüntüleyin
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtreler</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => exportLogs('json')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>JSON</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => exportLogs('csv')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-4 rounded-lg space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Seviye</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm seviyeler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm seviyeler</SelectItem>
                    <SelectItem value="INFO">Bilgi</SelectItem>
                    <SelectItem value="WARNING">Uyarı</SelectItem>
                    <SelectItem value="ERROR">Hata</SelectItem>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tip</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm tipler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm tipler</SelectItem>
                    <SelectItem value="SYSTEM">Sistem</SelectItem>
                    <SelectItem value="USER">Kullanıcı</SelectItem>
                    <SelectItem value="SECURITY">Güvenlik</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Başlangıç Tarihi</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bitiş Tarihi</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Log ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getLevelColor(log.level)}>
                            {log.level}
                          </Badge>
                          <Badge className={getTypeColor(log.type)}>
                            {log.type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: tr })}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">
                          {log.message}
                        </p>
                        {log.details && (
                          <p className="text-sm text-gray-600 mb-2">
                            {log.details}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {log.user && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{log.user.name}</span>
                            </div>
                          )}
                          {log.metadata?.ip && (
                            <span>IP: {log.metadata.ip}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {logs.length === 0 && (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Log bulunamadı
                </h3>
                <p className="text-gray-500">
                  Seçilen kriterlere uygun log kaydı bulunamadı
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Sayfa {page} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 