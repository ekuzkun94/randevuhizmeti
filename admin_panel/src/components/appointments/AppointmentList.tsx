'use client'

import { useState } from 'react'
import { Edit, Trash2, MoreHorizontal, Clock, User, Building } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Appointment {
  id: string
  employeeId: string
  customerId: string
  start: string
  end: string
  status: string
  note?: string
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    name: string
    provider: {
      id: string
      name: string
    }
  }
  customer: {
    id: string
    name: string
    email: string
  }
}

interface AppointmentListProps {
  appointments: Appointment[]
  loading: boolean
  onEdit: (appointment: Appointment) => void
  onDelete: () => void
}

export function AppointmentList({
  appointments,
  loading,
  onEdit,
  onDelete
}: AppointmentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      setDeletingId(id)
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete()
      } else {
        alert('Randevu silinirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('Randevu silinirken bir hata oluştu')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Planlandı'
      case 'COMPLETED':
        return 'Tamamlandı'
      case 'CANCELLED':
        return 'İptal'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih & Saat</TableHead>
            <TableHead>İşletme</TableHead>
            <TableHead>Çalışan</TableHead>
            <TableHead>Müşteri</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Not</TableHead>
            <TableHead className="w-[100px]">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Henüz randevu bulunmuyor
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {formatDateTime(appointment.start)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.end).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>{appointment.employee.provider.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{appointment.employee.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{appointment.customer.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(appointment.status)}>
                    {getStatusText(appointment.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {appointment.note ? (
                    <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                      {appointment.note}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(appointment)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(appointment.id)}
                        disabled={deletingId === appointment.id}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingId === appointment.id ? 'Siliniyor...' : 'Sil'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 