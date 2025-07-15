'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserTable } from '@/components/users/UserTable'
import { UserModal } from '@/components/users/UserModal'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  lastLoginAt?: string
}

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleCreate = () => {
    setModalMode('create')
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setModalMode('edit')
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleView = (user: User) => {
    // TODO: Implement user detail view
    console.log('View user:', user)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Kullanıcı başarıyla silindi')
        // Refresh the table
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Kullanıcı silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Kullanıcı silinirken hata oluştu')
    }
  }

  const handleSubmit = async (userData: any) => {
    try {
      const url = modalMode === 'create' ? '/api/users' : `/api/users/${selectedUser?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        toast.success(
          modalMode === 'create' 
            ? 'Kullanıcı başarıyla oluşturuldu' 
            : 'Kullanıcı başarıyla güncellendi'
        )
        // Refresh the table
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'İşlem sırasında hata oluştu')
      }
    } catch (error) {
      console.error('Error submitting user:', error)
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
            <p className="text-muted-foreground">
              Sistem kullanıcılarını yönetin ve izleyin
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <UserTable
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onCreate={handleCreate}
        />
      </motion.div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  )
} 