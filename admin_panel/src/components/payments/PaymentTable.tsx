'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Payment {
  id: string;
  appointmentId: string;
  customerId: string;
  employeeId: string;
  serviceId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  receiptNumber?: string;
  notes?: string;
  paidAt?: Date;
  createdAt: Date;
  customer: {
    name: string;
    email: string;
  };
  employee: {
    name: string;
  };
  service: {
    name: string;
    price: number;
  };
  appointment: {
    start: Date;
    end: Date;
  };
}

interface PaymentTableProps {
  payments: Payment[];
  loading: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
  onStatusChange: (paymentId: string, status: string) => void;
}

export default function PaymentTable({ 
  payments, 
  loading, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: PaymentTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ödendi</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Beklemede</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Başarısız</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">İade Edildi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'BANK_TRANSFER':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'ONLINE':
        return <CreditCard className="w-4 h-4 text-orange-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Nakit';
      case 'CREDIT_CARD': return 'Kredi Kartı';
      case 'BANK_TRANSFER': return 'Banka Transferi';
      case 'ONLINE': return 'Online Ödeme';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Ödemeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Henüz ödeme bulunmuyor</p>
        <p className="text-sm text-gray-400 mt-1">Yeni ödeme oluşturmak için yukarıdaki butonu kullanın</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Müşteri</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Hizmet</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Çalışan</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Tutar</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Ödeme Yöntemi</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Durum</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Tarih</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900">{payment.customer.name}</div>
                  <div className="text-sm text-gray-500">{payment.customer.email}</div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{payment.service.name}</div>
                <div className="text-sm text-gray-500">
                  {new Date(payment.appointment.start).toLocaleDateString('tr-TR')}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{payment.employee.name}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">
                  {formatCurrency(payment.amount)}
                </div>
                {payment.receiptNumber && (
                  <div className="text-sm text-gray-500">
                    #{payment.receiptNumber}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(payment.paymentMethod)}
                  <span className="text-gray-900">
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                {getStatusBadge(payment.status)}
              </td>
              <td className="py-3 px-4">
                <div className="text-sm text-gray-900">
                  {formatDate(payment.createdAt)}
                </div>
                {payment.paidAt && (
                  <div className="text-xs text-gray-500">
                    Ödendi: {formatDate(payment.paidAt)}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(payment)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </DropdownMenuItem>
                    {payment.status === 'PENDING' && (
                      <>
                        <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'PAID')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ödendi Olarak İşaretle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'FAILED')}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Başarısız Olarak İşaretle
                        </DropdownMenuItem>
                      </>
                    )}
                    {payment.status === 'PAID' && (
                      <DropdownMenuItem onClick={() => onStatusChange(payment.id, 'REFUNDED')}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        İade Et
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(payment.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 