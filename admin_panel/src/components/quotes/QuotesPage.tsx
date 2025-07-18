'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { toast } from 'sonner'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { QuoteModal } from './QuoteModal'
import { QuotePreviewModal } from './QuotePreviewModal'

interface Quote {
  id: string
  quoteNumber: string
  title: string
  description?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  status: string
  validUntil?: string
  sentAt?: string
  acceptedAt?: string
  rejectedAt?: string
  pdfPath?: string
  createdAt: string
  updatedAt: string
  items: QuoteItem[]
}

interface QuoteItem {
  id: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  total: number
  order: number
}

interface QuoteStats {
  total: number
  draft: number
  sent: number
  accepted: number
  rejected: number
  totalValue: number
  thisMonth: number
}

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [stats, setStats] = useState<QuoteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchQuotes()
    fetchStats()
  }, [])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })

      const response = await fetch(`/api/quotes?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setQuotes(data.quotes || [])
      } else {
        toast.error('Teklifler yüklenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Teklifler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/quotes/stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setSelectedQuote(null)
    setIsModalOpen(true)
  }

  const handleEdit = (quote: Quote) => {
    setModalMode('edit')
    setSelectedQuote(quote)
    setIsModalOpen(true)
  }

  const handlePreview = (quote: Quote) => {
    setSelectedQuote(quote)
    setIsPreviewModalOpen(true)
  }

  const handleDelete = async (quoteId: string) => {
    if (!confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Teklif başarıyla silindi')
        fetchQuotes()
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Teklif silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting quote:', error)
      toast.error('Teklif silinirken hata oluştu')
    }
  }

  const handleGeneratePDF = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/pdf`, {
        method: 'POST'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `teklif-${quoteId}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('PDF başarıyla oluşturuldu')
      } else {
        toast.error('PDF oluşturulurken hata oluştu')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('PDF oluşturulurken hata oluştu')
    }
  }

  const handleSendQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Teklif başarıyla gönderildi')
        fetchQuotes()
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Teklif gönderilirken hata oluştu')
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      toast.error('Teklif gönderilirken hata oluştu')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary'
      case 'SENT':
        return 'default'
      case 'ACCEPTED':
        return 'success'
      case 'REJECTED':
        return 'destructive'
      case 'EXPIRED':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />
      case 'SENT':
        return <Send className="w-4 h-4" />
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />
      case 'EXPIRED':
        return <Clock className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const columns = [
    {
      key: 'quoteNumber',
      label: 'Teklif No',
      render: (value: string, row: Quote) => (
        <div className="font-mono text-sm font-medium text-gray-900">
          {value}
        </div>
      )
    },
    {
      key: 'title',
      label: 'Başlık',
      render: (value: string, row: Quote) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {row.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Müşteri',
      render: (value: string, row: Quote) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.customerEmail}</div>
        </div>
      )
    },
    {
      key: 'total',
      label: 'Toplam',
      render: (value: number, row: Quote) => (
        <div className="font-medium text-gray-900">
          ₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Durum',
      render: (value: string, row: Quote) => (
        <Badge variant={getStatusBadgeVariant(value) as any}>
          <div className="flex items-center gap-1">
            {getStatusIcon(value)}
            {value === 'DRAFT' && 'Taslak'}
            {value === 'SENT' && 'Gönderildi'}
            {value === 'ACCEPTED' && 'Kabul Edildi'}
            {value === 'REJECTED' && 'Reddedildi'}
            {value === 'EXPIRED' && 'Süresi Doldu'}
          </div>
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Oluşturulma',
      render: (value: string, row: Quote) => (
        <div className="text-sm text-gray-500">
          {format(new Date(value), 'dd/MM/yyyy', { locale: tr })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (value: any, row: Quote) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreview(row)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGeneratePDF(row.id)}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
          {row.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendQuote(row.id)}
              className="h-8 w-8 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const statsCards = stats ? [
    {
      title: 'Toplam Teklif',
      value: stats.total,
      icon: <FileText className="h-6 w-6" />,
      gradient: 'from-blue-500 to-blue-600',
      change: { value: stats.thisMonth, type: 'increase' as const, period: 'Bu ay' }
    },
    {
      title: 'Taslak',
      value: stats.draft,
      icon: <FileText className="h-6 w-6" />,
      gradient: 'from-gray-500 to-gray-600',
      change: { value: 0, type: 'neutral' as const, period: 'Şu an' }
    },
    {
      title: 'Gönderilen',
      value: stats.sent,
      icon: <Send className="h-6 w-6" />,
      gradient: 'from-orange-500 to-orange-600',
      change: { value: 0, type: 'neutral' as const, period: 'Şu an' }
    },
    {
      title: 'Kabul Edilen',
      value: stats.accepted,
      icon: <CheckCircle className="h-6 w-6" />,
      gradient: 'from-green-500 to-green-600',
      change: { value: 0, type: 'neutral' as const, period: 'Şu an' }
    },
    {
      title: 'Toplam Değer',
      value: `₺${stats.totalValue.toLocaleString('tr-TR')}`,
      icon: <DollarSign className="h-6 w-6" />,
      gradient: 'from-purple-500 to-purple-600',
      change: { value: 0, type: 'neutral' as const, period: 'Şu an' }
    }
  ] : []

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                      <div className={`bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Durum</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm durumlar</SelectItem>
                    <SelectItem value="DRAFT">Taslak</SelectItem>
                    <SelectItem value="SENT">Gönderildi</SelectItem>
                    <SelectItem value="ACCEPTED">Kabul Edildi</SelectItem>
                    <SelectItem value="REJECTED">Reddedildi</SelectItem>
                    <SelectItem value="EXPIRED">Süresi Doldu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Arama</label>
                <Input
                  placeholder="Teklif no, başlık veya müşteri ara..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Başlangıç Tarihi</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Bitiş Tarihi</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={fetchQuotes} 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Search className="w-4 h-4" />
                Ara
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: 'all', search: '', startDate: '', endDate: '' })}
              >
                Sıfırla
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quotes Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-800">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                Teklifler
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchQuotes} 
                  className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Yenile
                </Button>
                <Button 
                  onClick={handleCreate} 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Teklif
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={quotes}
              columns={columns}
              loading={loading}
              emptyMessage="Henüz teklif bulunmuyor"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      {isModalOpen && (
        <QuoteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          quote={selectedQuote}
          mode={modalMode}
          onSuccess={() => {
            setIsModalOpen(false)
            fetchQuotes()
            fetchStats()
          }}
        />
      )}

      {isPreviewModalOpen && selectedQuote && (
        <QuotePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          quote={selectedQuote}
          onGeneratePDF={() => handleGeneratePDF(selectedQuote.id)}
        />
      )}
    </div>
  )
} 