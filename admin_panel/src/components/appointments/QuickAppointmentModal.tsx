'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Package,
  Save,
  X
} from 'lucide-react';

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotInfo: any;
  onSave: (appointmentData: any) => void;
}

export default function QuickAppointmentModal({
  isOpen,
  onClose,
  slotInfo,
  onSave
}: QuickAppointmentModalProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    providerId: '',
    employeeId: '',
    note: ''
  });

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Müşterileri yükle
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
      } catch (error) {
        console.error('Müşteriler yüklenirken hata:', error);
      }
    };
    fetchCustomers();
  }, []);

  // Hizmetleri yükle
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (Array.isArray(data.services)) {
          setServices(data.services);
        }
      } catch (error) {
        console.error('Hizmetler yüklenirken hata:', error);
      }
    };
    fetchServices();
  }, []);

  // Hizmet sağlayıcılarını yükle
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/providers');
        const data = await res.json();
        if (Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      } catch (error) {
        console.error('Hizmet sağlayıcıları yüklenirken hata:', error);
      }
    };
    fetchProviders();
  }, []);

  // Çalışanları yükle
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        const data = await res.json();
        if (Array.isArray(data.employees)) {
          setEmployees(data.employees);
        }
      } catch (error) {
        console.error('Çalışanlar yüklenirken hata:', error);
      }
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const appointmentData = {
        ...formData,
        start: slotInfo.start,
        end: slotInfo.end,
        status: 'beklemede'
      };

      await onSave(appointmentData);
      handleClose();
    } catch (error) {
      console.error('Randevu kaydedilirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hizmet sağlayıcısı seçildiğinde çalışanları filtrele
  useEffect(() => {
    if (formData.serviceId && formData.providerId) {
      const filtered = employees.filter((employee: any) => 
        employee.providerId === formData.providerId
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  }, [formData.serviceId, formData.providerId, employees]);

  // Hizmet değiştiğinde hizmet sağlayıcısını sıfırla
  const handleServiceChange = (serviceId: string) => {
    setFormData({
      ...formData,
      serviceId,
      providerId: '',
      employeeId: ''
    });
  };

  // Hizmet sağlayıcısı değiştiğinde çalışanı sıfırla
  const handleProviderChange = (providerId: string) => {
    setFormData({
      ...formData,
      providerId,
      employeeId: ''
    });
  };

  const handleClose = () => {
    setFormData({
      customerId: '',
      serviceId: '',
      providerId: '',
      employeeId: '',
      note: ''
    });
    setFilteredEmployees([]);
    onClose();
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!slotInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Yeni Randevu Ekle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seçilen Zaman Bilgisi */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Başlangıç:</span>
                  <span>{formatDateTime(slotInfo.start)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Bitiş:</span>
                  <span>{formatDateTime(slotInfo.end)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Randevu Bilgileri */}
          <div className="space-y-4">
            {/* Müşteri */}
            <div className="space-y-2">
              <Label htmlFor="customer">Müşteri</Label>
              <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hizmet Seçimi */}
            <div className="space-y-2">
              <Label htmlFor="service">Hizmet</Label>
              <Select value={formData.serviceId} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Önce hizmet seçin" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service: any) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration} dk)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hizmet Sağlayıcısı Seçimi */}
            {formData.serviceId && (
              <div className="space-y-2">
                <Label htmlFor="provider">Hizmet Sağlayıcısı</Label>
                <Select value={formData.providerId} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hizmet sağlayıcısı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider: any) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Çalışan Seçimi */}
            {formData.providerId && (
              <div className="space-y-2">
                <Label htmlFor="employee">Çalışan</Label>
                <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Çalışan seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmployees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Not */}
          <div className="space-y-2">
            <Label htmlFor="note">Not</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Randevu notu..."
              rows={3}
            />
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-1" />
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-1" />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 