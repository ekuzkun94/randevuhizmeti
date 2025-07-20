'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Package, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock as ClockIcon
} from 'lucide-react';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onEdit?: (appointment: any) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

export default function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  onEdit,
  onDelete,
  onStatusChange
}: AppointmentDetailModalProps) {
  if (!appointment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'onaylandı': return 'bg-green-100 text-green-800';
      case 'beklemede': return 'bg-yellow-100 text-yellow-800';
      case 'iptal': return 'bg-red-100 text-red-800';
      case 'tamamlandı': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'onaylandı': return <CheckCircle className="w-4 h-4" />;
      case 'beklemede': return <ClockIcon className="w-4 h-4" />;
      case 'iptal': return <XCircle className="w-4 h-4" />;
      case 'tamamlandı': return <CheckCircle className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Randevu Detayları
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Durum ve İşlemler */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(appointment.status)} flex items-center gap-1`}>
              {getStatusIcon(appointment.status)}
              {appointment.status}
            </Badge>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(appointment)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Düzenle
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={() => onDelete(appointment.id)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Sil
                </Button>
              )}
            </div>
          </div>

          {/* Randevu Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Randevu Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Tarih:</span>
                  <span>{formatDate(appointment.start)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Saat:</span>
                  <span>{formatTime(appointment.start)} - {formatTime(appointment.end)}</span>
                </div>
              </div>
              {appointment.note && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <span className="font-medium">Not:</span>
                  <p className="mt-1 text-sm">{appointment.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Müşteri Bilgileri */}
          {appointment.customer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Ad Soyad:</span>
                  <span>{appointment.customer.name}</span>
                </div>
                {appointment.customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">E-posta:</span>
                    <span>{appointment.customer.email}</span>
                  </div>
                )}
                {appointment.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Telefon:</span>
                    <span>{appointment.customer.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Çalışan Bilgileri */}
          {appointment.employee && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Çalışan Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Ad Soyad:</span>
                  <span>{appointment.employee.name}</span>
                </div>
                {appointment.employee.position && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Pozisyon:</span>
                    <span>{appointment.employee.position}</span>
                  </div>
                )}
                {appointment.employee.provider && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Kurum:</span>
                    <span>{appointment.employee.provider.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hizmet Bilgileri */}
          {appointment.service && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Hizmet Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Hizmet:</span>
                  <span>{appointment.service.name}</span>
                </div>
                {appointment.service.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Süre:</span>
                    <span>{appointment.service.duration} dakika</span>
                  </div>
                )}
                {appointment.service.price && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Fiyat:</span>
                    <span>{appointment.service.price} TL</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Durum Değiştirme */}
          {onStatusChange && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Durum Değiştir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStatusChange(appointment.id, 'onaylandı')}
                    disabled={appointment.status === 'onaylandı'}
                  >
                    Onayla
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStatusChange(appointment.id, 'tamamlandı')}
                    disabled={appointment.status === 'tamamlandı'}
                  >
                    Tamamlandı
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStatusChange(appointment.id, 'iptal')}
                    disabled={appointment.status === 'iptal'}
                  >
                    İptal Et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 