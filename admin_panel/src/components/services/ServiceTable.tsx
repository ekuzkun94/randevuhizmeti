'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ServiceTableProps {
  services: Service[]
  loading: boolean
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onView: (service: Service) => void
  onCreate: () => void
}

export function ServiceTable({ 
  services, 
  loading, 
  onEdit, 
  onDelete, 
  onView, 
  onCreate 
}: ServiceTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && service.isActive) ||
                         (filterActive === 'inactive' && !service.isActive)
    
    return matchesSearch && matchesFilter
  })

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}s ${mins}dk`
    }
    return `${mins} dakika`
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Belirtilmemiş'
    return `${price.toLocaleString('tr-TR')} ₺`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Yükleniyor...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterActive === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive('all')}
            >
              Tümü
            </Button>
            <Button
              variant={filterActive === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive('active')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Aktif
            </Button>
            <Button
              variant={filterActive === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive('inactive')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Pasif
            </Button>
          </div>
        </div>

        <Button onClick={onCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Hizmet
        </Button>
      </div>

      {/* Services Table */}
      <div className="card">
        <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-medium text-muted-foreground">Hizmet</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Süre</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Fiyat</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Durum</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Oluşturulma</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || filterActive !== 'all' ? 'Arama kriterlerine uygun hizmet bulunamadı' : 'Henüz hizmet eklenmemiş'}
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service, index) => (
                    <motion.tr
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDuration(service.duration)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>{formatPrice(service.price)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={service.isActive ? 'default' : 'secondary'}>
                          {service.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(service.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(service)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(service)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(service)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Toplam {filteredServices.length} hizmet gösteriliyor
          {searchTerm && ` (${services.length} toplam)`}
        </span>
      </div>
    </div>
  )
} 