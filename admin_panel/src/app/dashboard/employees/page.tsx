"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { EmployeeTable } from '@/components/employees/EmployeeTable'
import { EmployeeModal } from '@/components/employees/EmployeeModal'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  position?: string
  isActive: boolean
  provider: {
    id: string
    name: string
  }
  providerId: string
  createdAt: string
}

export default function EmployeesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const handleCreate = () => {
    setModalMode('create')
    setSelectedEmployee(null)
    setIsModalOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setModalMode('edit')
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  const handleView = (employee: Employee) => {
    // TODO: Detay görüntüleme
    console.log('View employee:', employee)
  }

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) {
      return
    }
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Çalışan başarıyla silindi')
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Çalışan silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Çalışan silinirken hata oluştu')
    }
  }

  const handleSubmit = async (employeeData: any) => {
    try {
      const url = modalMode === 'create' ? '/api/employees' : `/api/employees/${selectedEmployee?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      })
      if (response.ok) {
        toast.success(
          modalMode === 'create' 
            ? 'Çalışan başarıyla oluşturuldu' 
            : 'Çalışan başarıyla güncellendi'
        )
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'İşlem sırasında hata oluştu')
      }
    } catch (error) {
      console.error('Error submitting employee:', error)
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
            <h1 className="text-3xl font-bold tracking-tight">Çalışanlar</h1>
            <p className="text-muted-foreground">
              İşletmelere bağlı çalışanları yönetin ve izleyin
            </p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <EmployeeTable
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onCreate={handleCreate}
        />
      </motion.div>
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        employee={selectedEmployee}
        mode={modalMode}
      />
    </div>
  )
} 