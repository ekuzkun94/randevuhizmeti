'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Clock, DollarSign, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'

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

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Service>) => void
  service: Service | null
  mode: 'create' | 'edit' | 'view'
}

export function ServiceModal({ isOpen, onClose, onSubmit, service, mode }: ServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: '',
    isActive: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (service && mode !== 'create') {
      setFormData({
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        price: service.price?.toString() || '',
        isActive: service.isActive
      })
    } else {
      setFormData({
        name: '',
        description: '',
        duration: 60,
        price: '',
        isActive: true
      })
    }
    setErrors({})
  }, [service, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Hizmet adı gereklidir'
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Süre 0\'dan büyük olmalıdır'
    }

    if (formData.price && parseFloat(formData.price) < 0) {
      newErrors.price = 'Fiyat negatif olamaz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      duration: formData.duration,
      price: formData.price ? parseFloat(formData.price) : undefined,
      isActive: formData.isActive
    }

    onSubmit(submitData)
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const isViewMode = mode === 'view'
  const isEditMode = mode === 'edit'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {mode === 'create' && 'Yeni Hizmet'}
                    {mode === 'edit' && 'Hizmet Düzenle'}
                    {mode === 'view' && 'Hizmet Detayları'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {mode === 'create' && 'Yeni bir hizmet oluşturun'}
                    {mode === 'edit' && 'Hizmet bilgilerini güncelleyin'}
                    {mode === 'view' && 'Hizmet detaylarını görüntüleyin'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Service Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Hizmet Adı *</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Hizmet adını girin"
                  disabled={isViewMode}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Açıklama</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Hizmet açıklaması (opsiyonel)"
                  disabled={isViewMode}
                  rows={3}
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Süre (dakika) *</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  placeholder="60"
                  disabled={isViewMode}
                  className={errors.duration ? 'border-red-500' : ''}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500">{errors.duration}</p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Fiyat (₺)</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="100.00"
                  disabled={isViewMode}
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Aktif</span>
                </Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  disabled={isViewMode}
                />
              </div>

              {/* Action Buttons */}
              {!isViewMode && (
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                  >
                    {mode === 'create' ? 'Oluştur' : 'Güncelle'}
                  </Button>
                </div>
              )}

              {isViewMode && (
                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={onClose}
                    className="w-full"
                  >
                    Kapat
                  </Button>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 