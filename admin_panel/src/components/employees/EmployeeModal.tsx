"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
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
import { X } from 'lucide-react'

interface Employee {
  id?: string
  name: string
  email?: string
  phone?: string
  position?: string
  isActive: boolean
  providerId: string
}

interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (employee: Omit<Employee, 'id'>) => void
  employee?: Employee | null
  mode: 'create' | 'edit'
}

interface ProviderOption {
  id: string
  name: string
}

export function EmployeeModal({ isOpen, onClose, onSubmit, employee, mode }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Employee>({
    name: '',
    email: '',
    phone: '',
    position: '',
    isActive: true,
    providerId: ''
  })
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<ProviderOption[]>([])

  useEffect(() => {
    // İşletmeleri çek
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/providers')
        const data = await res.json()
        if (res.ok && data.providers) {
          setProviders(data.providers.map((p: any) => ({ id: p.id, name: p.name })))
          if (!formData.providerId && data.providers.length > 0) {
            setFormData(f => ({ ...f, providerId: data.providers[0].id }))
          }
        }
      } catch (e) {
        setProviders([])
      }
    }
    fetchProviders()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (employee && mode === 'edit') {
      setFormData(employee)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        isActive: true,
        providerId: providers[0]?.id || ''
      })
    }
  }, [employee, mode, providers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {mode === 'create' ? 'Yeni Çalışan Oluştur' : 'Çalışan Düzenle'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Çalışan adı"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="calisan@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Telefon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Pozisyon</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Pozisyon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">İşletme</Label>
                <Select
                  value={formData.providerId}
                  onValueChange={(value) => setFormData({ ...formData, providerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="İşletme seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Durum</Label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : mode === 'create' ? 'Oluştur' : 'Güncelle'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
} 