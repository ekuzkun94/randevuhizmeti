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
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Calendar,
  Repeat,
  Timer,
  Zap,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface ScheduledTask {
  id: string
  name: string
  description?: string
  type: string
  schedule: string
  isActive: boolean
  data?: string
  retryCount: number
  timeout: number
  lastRunAt?: string
  nextRunAt?: string
  createdAt: string
  executions: Array<{
    id: string
    status: 'SUCCESS' | 'FAILED' | 'RUNNING'
    startedAt: string
    completedAt?: string
    error?: string
    duration?: number
  }>
  _count: {
    executions: number
  }
}

export function SchedulerManager() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  const [filters, setFilters] = useState({
    isActive: 'all',
    type: 'all',
  })

  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    type: 'WEBHOOK',
    schedule: '',
    isActive: true,
    data: '',
    retryCount: 3,
    timeout: 300,
  })

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })

      const response = await fetch(`/api/scheduler?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setTasks(data.tasks.map((task: any) => ({
          ...task,
          data: task.data ? JSON.parse(task.data) : null,
        })))
      } else {
        toast.error('Görevler yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Görevler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          data: newTask.data ? JSON.parse(newTask.data) : null,
        }),
      })

      if (response.ok) {
        toast.success('Görev başarıyla oluşturuldu')
        setShowCreateModal(false)
        setNewTask({
          name: '',
          description: '',
          type: 'WEBHOOK',
          schedule: '',
          isActive: true,
          data: '',
          retryCount: 3,
          timeout: 300,
        })
        fetchTasks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Görev oluşturulurken hata oluştu')
      }
    } catch (error) {
      toast.error('Görev oluşturulurken hata oluştu')
    }
  }

  const handleToggleTask = async (taskId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/scheduler/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        toast.success(`Görev ${!isActive ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`)
        fetchTasks()
      } else {
        toast.error('Görev durumu güncellenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Görev durumu güncellenirken hata oluştu')
    }
  }

  const handleRunTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/scheduler/${taskId}/run`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Görev manuel olarak çalıştırıldı')
        fetchTasks()
      } else {
        toast.error('Görev çalıştırılırken hata oluştu')
      }
    } catch (error) {
      toast.error('Görev çalıştırılırken hata oluştu')
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'WEBHOOK':
        return <Zap className="w-5 h-5 text-blue-500" />
      case 'EMAIL':
        return <Calendar className="w-5 h-5 text-green-500" />
      case 'DATABASE':
        return <Settings className="w-5 h-5 text-purple-500" />
      case 'API':
        return <Timer className="w-5 h-5 text-orange-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'RUNNING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-100 text-green-800">Başarılı</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Başarısız</Badge>
      case 'RUNNING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Çalışıyor</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
  }

  const formatSchedule = (schedule: string) => {
    // Simple cron-like format display
    const parts = schedule.split(' ')
    if (parts.length === 5) {
      return `${parts[1]}:${parts[0]} ${parts[2]}/${parts[3]} * ${parts[4]}`
    }
    return schedule
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zamanlayıcı</h2>
          <p className="text-muted-foreground">
            Zamanlanmış görevleri yönetin ve izleyin
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Yeni Görev
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm türler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm türler</SelectItem>
                  <SelectItem value="WEBHOOK">Webhook</SelectItem>
                  <SelectItem value="EMAIL">E-posta</SelectItem>
                  <SelectItem value="DATABASE">Veritabanı</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={fetchTasks} className="mt-4">
            Filtrele
          </Button>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTaskIcon(task.type)}
                      <CardTitle className="text-lg">{task.name}</CardTitle>
                    </div>
                    <Badge variant={task.isActive ? 'default' : 'secondary'}>
                      {task.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {task.description || 'Açıklama yok'}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        Zamanlama
                      </span>
                      <span className="font-mono text-xs">{formatSchedule(task.schedule)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        Timeout
                      </span>
                      <span>{task.timeout}s</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        Yeniden Deneme
                      </span>
                      <span>{task.retryCount}</span>
                    </div>
                  </div>
                  
                  {/* Last Execution */}
                  {task.executions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Son Çalıştırma:</p>
                      <div className="flex items-center gap-2 text-xs">
                        {getStatusIcon(task.executions[0].status)}
                        <span>{getStatusBadge(task.executions[0].status)}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(task.executions[0].startedAt), 'dd/MM HH:mm', { locale: tr })}
                        </span>
                        {task.executions[0].duration && (
                          <span className="text-muted-foreground">
                            ({task.executions[0].duration}ms)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task._count.executions} çalıştırma
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(task.createdAt), 'dd/MM/yyyy', { locale: tr })}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunTask(task.id)}
                      className="flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Çalıştır
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleTask(task.id, task.isActive)}
                      className="flex items-center gap-1"
                    >
                      {task.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {task.isActive ? 'Durdur' : 'Başlat'}
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

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Zamanlanmış Görev</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Görev Adı</label>
                <Input
                  value={newTask.name}
                  onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Görev adı"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tür</label>
                <Select value={newTask.type} onValueChange={(value) => setNewTask(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEBHOOK">Webhook</SelectItem>
                    <SelectItem value="EMAIL">E-posta</SelectItem>
                    <SelectItem value="DATABASE">Veritabanı</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Görev açıklaması..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Zamanlama (Cron Format)</label>
              <Input
                value={newTask.schedule}
                onChange={(e) => setNewTask(prev => ({ ...prev, schedule: e.target.value }))}
                placeholder="0 0 * * * (Her gün gece yarısı)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: dakika saat gün ay hafta (örn: 0 0 * * * = her gün gece yarısı)
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Timeout (saniye)</label>
                <Input
                  type="number"
                  value={newTask.timeout}
                  onChange={(e) => setNewTask(prev => ({ ...prev, timeout: parseInt(e.target.value) || 300 }))}
                  placeholder="300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Yeniden Deneme</label>
                <Input
                  type="number"
                  value={newTask.retryCount}
                  onChange={(e) => setNewTask(prev => ({ ...prev, retryCount: parseInt(e.target.value) || 3 }))}
                  placeholder="3"
                />
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTask.isActive}
                    onChange={(e) => setNewTask(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span className="text-sm">Aktif</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Veri (JSON)</label>
              <Textarea
                value={newTask.data}
                onChange={(e) => setNewTask(prev => ({ ...prev, data: e.target.value }))}
                placeholder='{"url": "https://api.example.com/webhook", "method": "POST"}'
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateTask}>
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 