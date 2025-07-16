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
  Eye,
  Check,
  X,
  Clock,
  AlertCircle,
  Users,
  Settings,
  FileText,
  ArrowRight,
  User,
  Shield,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Workflow {
  id: string
  name: string
  description?: string
  entityType: string
  isActive: boolean
  createdAt: string
  steps: Array<{
    id: string
    name: string
    description?: string
    order: number
    approverRole?: string
    approverUserId?: string
    isRequired: boolean
    canReject: boolean
    canEdit: boolean
    autoApprove: boolean
    timeoutHours?: number
  }>
  _count: {
    requests: number
  }
}

interface ApprovalRequest {
  id: string
  workflowId: string
  entityType: string
  entityId: string
  requesterId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
  currentStep: number
  title: string
  description?: string
  data?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  dueDate?: string
  createdAt: string
  workflow: {
    id: string
    name: string
    steps: Array<{
      id: string
      name: string
      order: number
    }>
  }
  requester: {
    id: string
    name: string
    email: string
  }
  approvals: Array<{
    id: string
    status: 'APPROVED' | 'REJECTED'
    comment?: string
    createdAt: string
    approver: {
      id: string
      name: string
      email: string
    }
    step: {
      id: string
      name: string
      order: number
    }
  }>
}

export function ApprovalManager() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [activeTab, setActiveTab] = useState<'workflows' | 'requests'>('workflows')
  const [filters, setFilters] = useState({
    status: '',
    entityType: '',
  })

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    entityType: '',
    isActive: true,
    steps: [] as Array<{
      name: string
      description: string
      approverRole: string
      approverUserId: string
      isRequired: boolean
      canReject: boolean
      canEdit: boolean
      autoApprove: boolean
      timeoutHours: number
    }>,
  })

  const [newRequest, setNewRequest] = useState({
    workflowId: '',
    entityType: '',
    entityId: '',
    title: '',
    description: '',
    priority: 'NORMAL' as const,
    dueDate: '',
  })

  const [approvalData, setApprovalData] = useState({
    action: 'approve' as 'approve' | 'reject',
    comment: '',
  })

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows')
      const data = await response.json()
      
      if (response.ok) {
        setWorkflows(data.workflows)
      } else {
        toast.error('İş akışları yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('İş akışları yüklenirken hata oluştu')
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/approvals?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setRequests(data.requests.map((request: any) => ({
          ...request,
          data: request.data ? JSON.parse(request.data) : null,
        })))
      } else {
        toast.error('Onay istekleri yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Onay istekleri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkflows()
    fetchRequests()
  }, [])

  const handleCreateWorkflow = async () => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflow),
      })

      if (response.ok) {
        toast.success('İş akışı başarıyla oluşturuldu')
        setShowWorkflowModal(false)
        setNewWorkflow({
          name: '',
          description: '',
          entityType: '',
          isActive: true,
          steps: [],
        })
        fetchWorkflows()
      } else {
        const error = await response.json()
        toast.error(error.error || 'İş akışı oluşturulurken hata oluştu')
      }
    } catch (error) {
      toast.error('İş akışı oluşturulurken hata oluştu')
    }
  }

  const handleCreateRequest = async () => {
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      })

      if (response.ok) {
        toast.success('Onay isteği başarıyla oluşturuldu')
        setShowRequestModal(false)
        setNewRequest({
          workflowId: '',
          entityType: '',
          entityId: '',
          title: '',
          description: '',
          priority: 'NORMAL',
          dueDate: '',
        })
        fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Onay isteği oluşturulurken hata oluştu')
      }
    } catch (error) {
      toast.error('Onay isteği oluşturulurken hata oluştu')
    }
  }

  const handleApproval = async () => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/approvals/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        setShowApprovalModal(false)
        setSelectedRequest(null)
        setApprovalData({ action: 'approve', comment: '' })
        fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Onay işlemi başarısız')
      }
    } catch (error) {
      toast.error('Onay işlemi başarısız')
    }
  }

  const addWorkflowStep = () => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, {
        name: '',
        description: '',
        approverRole: '',
        approverUserId: '',
        isRequired: true,
        canReject: true,
        canEdit: false,
        autoApprove: false,
        timeoutHours: 0,
      }],
    }))
  }

  const removeWorkflowStep = (index: number) => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }))
  }

  const updateWorkflowStep = (index: number, field: string, value: any) => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      ),
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Check className="w-4 h-4 text-green-500" />
      case 'REJECTED':
        return <X className="w-4 h-4 text-red-500" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'EXPIRED':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Onaylandı</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Reddedildi</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Beklemede</Badge>
      case 'EXPIRED':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Süresi Doldu</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Acil</Badge>
      case 'HIGH':
        return <Badge variant="outline" className="border-red-500 text-red-700">Yüksek</Badge>
      case 'NORMAL':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Normal</Badge>
      case 'LOW':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Düşük</Badge>
      default:
        return <Badge variant="secondary">Normal</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'workflows'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          İş Akışları
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'requests'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Onay İstekleri
        </button>
      </div>

      {activeTab === 'workflows' && (
        <div className="space-y-6">
          {/* Workflows Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">İş Akışları</h2>
              <p className="text-muted-foreground">
                Onay süreçlerini tanımlayın ve yönetin
              </p>
            </div>
            <Button onClick={() => setShowWorkflowModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni İş Akışı
            </Button>
          </div>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                        {workflow.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {workflow.description || 'Açıklama yok'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {workflow.entityType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {workflow.steps.length} adım
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Adımlar:</p>
                      {workflow.steps.slice(0, 3).map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                            {step.order}
                          </span>
                          <span className="flex-1">{step.name}</span>
                          {step.approverRole && (
                            <Badge variant="outline" className="text-xs">
                              {step.approverRole}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {workflow.steps.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{workflow.steps.length - 3} adım daha...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        {workflow._count.requests} istek
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(workflow.createdAt), 'dd/MM/yyyy', { locale: tr })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Requests Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Onay İstekleri</h2>
              <p className="text-muted-foreground">
                Bekleyen ve tamamlanan onay isteklerini görüntüleyin
              </p>
            </div>
            <Button onClick={() => setShowRequestModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni İstek
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Durum</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm durumlar</SelectItem>
                      <SelectItem value="PENDING">Beklemede</SelectItem>
                      <SelectItem value="APPROVED">Onaylandı</SelectItem>
                      <SelectItem value="REJECTED">Reddedildi</SelectItem>
                      <SelectItem value="EXPIRED">Süresi Doldu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Varlık Türü</label>
                  <Select value={filters.entityType} onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm türler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm türler</SelectItem>
                      <SelectItem value="user">Kullanıcı</SelectItem>
                      <SelectItem value="module">Modül</SelectItem>
                      <SelectItem value="license">Lisans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={fetchRequests} className="mt-4">
                Filtrele
              </Button>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(request.status)}
                            <h3 className="font-semibold">{request.title}</h3>
                            {getStatusBadge(request.status)}
                            {getPriorityBadge(request.priority)}
                          </div>
                          
                          {request.description && (
                            <p className="text-sm text-muted-foreground">
                              {request.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {request.requester.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {request.workflow.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {request.entityType}: {request.entityId}
                            </span>
                            {request.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(request.dueDate), 'dd/MM/yyyy', { locale: tr })}
                              </span>
                            )}
                          </div>
                          
                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>İlerleme</span>
                              <span>{request.currentStep}/{request.workflow.steps.length}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{
                                  width: `${(request.currentStep / request.workflow.steps.length) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {request.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowApprovalModal(true)
                              }}
                            >
                              Onayla/Reddet
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            Detaylar
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

      {/* Create Workflow Modal */}
      <Dialog open={showWorkflowModal} onOpenChange={setShowWorkflowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni İş Akışı Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">İş Akışı Adı</label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Kullanıcı Onay Süreci"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Varlık Türü</label>
                <Select value={newWorkflow.entityType} onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, entityType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Varlık türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Kullanıcı</SelectItem>
                    <SelectItem value="module">Modül</SelectItem>
                    <SelectItem value="license">Lisans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <Textarea
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                placeholder="İş akışı açıklaması..."
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">Onay Adımları</label>
                <Button type="button" variant="outline" size="sm" onClick={addWorkflowStep}>
                  <Plus className="w-4 h-4" />
                  Adım Ekle
                </Button>
              </div>
              
              <div className="space-y-4">
                {newWorkflow.steps.map((step, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Adım Adı</label>
                        <Input
                          value={step.name}
                          onChange={(e) => updateWorkflowStep(index, 'name', e.target.value)}
                          placeholder="Adım adı"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Onaylayan Rol</label>
                        <Input
                          value={step.approverRole}
                          onChange={(e) => updateWorkflowStep(index, 'approverRole', e.target.value)}
                          placeholder="ADMIN, MANAGER, etc."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Açıklama</label>
                        <Input
                          value={step.description}
                          onChange={(e) => updateWorkflowStep(index, 'description', e.target.value)}
                          placeholder="Adım açıklaması"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Zaman Aşımı (Saat)</label>
                        <Input
                          type="number"
                          value={step.timeoutHours}
                          onChange={(e) => updateWorkflowStep(index, 'timeoutHours', parseInt(e.target.value) || 0)}
                          placeholder="24"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.isRequired}
                          onChange={(e) => updateWorkflowStep(index, 'isRequired', e.target.checked)}
                        />
                        <span className="text-sm">Zorunlu</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.canReject}
                          onChange={(e) => updateWorkflowStep(index, 'canReject', e.target.checked)}
                        />
                        <span className="text-sm">Reddedebilir</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.canEdit}
                          onChange={(e) => updateWorkflowStep(index, 'canEdit', e.target.checked)}
                        />
                        <span className="text-sm">Düzenleyebilir</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.autoApprove}
                          onChange={(e) => updateWorkflowStep(index, 'autoApprove', e.target.checked)}
                        />
                        <span className="text-sm">Otomatik Onay</span>
                      </label>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeWorkflowStep(index)}
                        className="ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowWorkflowModal(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateWorkflow}>
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Onay İsteği</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">İş Akışı</label>
              <Select value={newRequest.workflowId} onValueChange={(value) => setNewRequest(prev => ({ ...prev, workflowId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="İş akışı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.filter(w => w.isActive).map(workflow => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Varlık Türü</label>
                <Input
                  value={newRequest.entityType}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, entityType: e.target.value }))}
                  placeholder="user, module, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Varlık ID</label>
                <Input
                  value={newRequest.entityId}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, entityId: e.target.value }))}
                  placeholder="varlık ID'si"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Başlık</label>
              <Input
                value={newRequest.title}
                onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Onay isteği başlığı"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <Textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Onay isteği açıklaması..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Öncelik</label>
                <Select value={newRequest.priority} onValueChange={(value: any) => setNewRequest(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Düşük</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">Yüksek</SelectItem>
                    <SelectItem value="URGENT">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Son Tarih</label>
                <Input
                  type="date"
                  value={newRequest.dueDate}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRequestModal(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateRequest}>
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Onay İşlemi</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">İşlem</label>
              <Select value={approvalData.action} onValueChange={(value: 'approve' | 'reject') => setApprovalData(prev => ({ ...prev, action: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Onayla</SelectItem>
                  <SelectItem value="reject">Reddet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Yorum</label>
              <Textarea
                value={approvalData.comment}
                onChange={(e) => setApprovalData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Onay/red yorumu..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                İptal
              </Button>
              <Button onClick={handleApproval}>
                {approvalData.action === 'approve' ? 'Onayla' : 'Reddet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 