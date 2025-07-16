'use client'

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

interface User {
  id?: string
  name: string
  email: string
  role: string
  status: string
  password?: string
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (user: Omit<User, 'id'>) => void
  user?: User | null
  mode: 'create' | 'edit'
}

interface RoleOption {
  id: string
  displayName: string
}

export function UserModal({ isOpen, onClose, onSubmit, user, mode }: UserModalProps) {
  const [formData, setFormData] = useState<User>({
    name: '',
    email: '',
    role: '',
    status: 'ACTIVE'
  })
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<RoleOption[]>([])

  useEffect(() => {
    // Rolleri çek
    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/roles')
        const data = await res.json()
        if (res.ok && data.roles) {
          setRoles(data.roles.map((r: any) => ({ id: r.id, displayName: r.displayName })))
          // Varsayılan rol ata
          if (!formData.role && data.roles.length > 0) {
            setFormData(f => ({ ...f, role: data.roles[0].id }))
          }
        }
      } catch (e) {
        setRoles([])
      }
    }
    fetchRoles()
  }, [])

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData(user)
    } else {
      setFormData({
        name: '',
        email: '',
        role: roles[0]?.id || '',
        status: 'ACTIVE'
      })
    }
  }, [user, mode, roles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const form = e.target as HTMLFormElement
      const formDataObj = new FormData(form)
      const password = formDataObj.get('password') as string
      
      const submitData = { ...formData }
      if (mode === 'create' && password) {
        submitData.password = password
      }
      // role -> roleId
      submitData.roleId = submitData.role
      delete submitData.role
      await onSubmit(submitData)
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
                {mode === 'create' ? 'Yeni Kullanıcı Oluştur' : 'Kullanıcı Düzenle'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kullanıcı adı"
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
                  placeholder="kullanici@example.com"
                  required
                />
              </div>

              {mode === 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Şifre"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Pasif</SelectItem>
                    <SelectItem value="SUSPENDED">Askıya Alınmış</SelectItem>
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