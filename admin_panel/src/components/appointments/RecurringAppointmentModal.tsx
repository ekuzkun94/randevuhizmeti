'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  Clock, 
  Repeat,
  Save,
  X,
  CalendarDays,
  CalendarRange,
  CalendarCheck
} from 'lucide-react';

interface RecurringAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotInfo: any;
  onSave: (appointmentData: any) => void;
}

export default function RecurringAppointmentModal({
  isOpen,
  onClose,
  slotInfo,
  onSave
}: RecurringAppointmentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    serviceId: '',
    providerId: '',
    employeeId: '',
    note: '',
    recurrenceType: 'weekly',
    recurrenceInterval: 1,
    recurrenceDays: [] as number[],
    recurrenceEndType: 'count',
    recurrenceEndCount: 10,
    recurrenceEndDate: '',
    excludeDates: [] as string[]
  });

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewDates, setPreviewDates] = useState<Date[]>([]);

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

  // Tekrarlama önizlemesi oluştur
  useEffect(() => {
    if (slotInfo && formData.recurrenceType) {
      const dates = generateRecurrenceDates();
      setPreviewDates(dates);
    }
  }, [formData, slotInfo]);

  const generateRecurrenceDates = (): Date[] => {
    if (!slotInfo) return [];

    const startDate = new Date(slotInfo.start);
    const dates: Date[] = [startDate];
    
    let currentDate = new Date(startDate);
    const endCount = formData.recurrenceEndType === 'count' 
      ? formData.recurrenceEndCount 
      : 50; // Maksimum 50 randevu önizlemesi

    for (let i = 1; i < endCount; i++) {
      const nextDate = new Date(currentDate);
      
      switch (formData.recurrenceType) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + formData.recurrenceInterval);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + (7 * formData.recurrenceInterval));
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + formData.recurrenceInterval);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + formData.recurrenceInterval);
          break;
      }

      // Bitiş tarihi kontrolü
      if (formData.recurrenceEndType === 'date' && formData.recurrenceEndDate) {
        const endDate = new Date(formData.recurrenceEndDate);
        if (nextDate > endDate) break;
      }

      // Hariç tutulan tarihler kontrolü
      const dateString = nextDate.toISOString().split('T')[0];
      if (!formData.excludeDates.includes(dateString)) {
        dates.push(new Date(nextDate));
      }
      
      currentDate = nextDate;
    }

    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Her tarih için randevu oluştur
      const promises = previewDates.map(date => {
        const appointmentData = {
          ...formData,
          start: new Date(date.getTime() + slotInfo.start.getTime() - new Date(slotInfo.start).getTime()),
          end: new Date(date.getTime() + slotInfo.end.getTime() - new Date(slotInfo.end).getTime()),
          status: 'beklemede'
        };
        return onSave(appointmentData);
      });

      await Promise.all(promises);
      handleClose();
    } catch (error) {
      console.error('Tekrarlayan randevular kaydedilirken hata:', error);
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
      title: '',
      customerId: '',
      serviceId: '',
      providerId: '',
      employeeId: '',
      note: '',
      recurrenceType: 'weekly',
      recurrenceInterval: 1,
      recurrenceDays: [],
      recurrenceEndType: 'count',
      recurrenceEndCount: 10,
      recurrenceEndDate: '',
      excludeDates: []
    });
    setFilteredEmployees([]);
    onClose();
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const weekDays = [
    { value: 0, label: 'Pazar' },
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' }
  ];

  if (!slotInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Tekrarlayan Randevu Oluştur
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Başlık */}
            <div className="space-y-2">
              <Label htmlFor="title">Randevu Başlığı</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Randevu başlığı"
                required
              />
            </div>

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

            {/* Çalışan */}
            <div className="space-y-2">
              <Label htmlFor="employee">Çalışan</Label>
              <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Çalışan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.provider?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hizmet */}
            <div className="space-y-2">
              <Label htmlFor="service">Hizmet</Label>
              <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Hizmet seçin" />
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
          </div>

          {/* Tekrarlama Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Tekrarlama Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tekrarlama Türü */}
                <div className="space-y-2">
                  <Label>Tekrarlama Türü</Label>
                  <Select value={formData.recurrenceType} onValueChange={(value) => setFormData({ ...formData, recurrenceType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Günlük</SelectItem>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                      <SelectItem value="monthly">Aylık</SelectItem>
                      <SelectItem value="yearly">Yıllık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tekrarlama Aralığı */}
                <div className="space-y-2">
                  <Label>Her Kaç {formData.recurrenceType === 'daily' ? 'gün' : formData.recurrenceType === 'weekly' ? 'hafta' : formData.recurrenceType === 'monthly' ? 'ay' : 'yıl'}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.recurrenceInterval}
                    onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
                  />
                </div>

                {/* Bitiş Türü */}
                <div className="space-y-2">
                  <Label>Bitiş Türü</Label>
                  <Select value={formData.recurrenceEndType} onValueChange={(value) => setFormData({ ...formData, recurrenceEndType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Randevu Sayısı</SelectItem>
                      <SelectItem value="date">Bitiş Tarihi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bitiş Detayları */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.recurrenceEndType === 'count' ? (
                  <div className="space-y-2">
                    <Label>Kaç Randevu Oluşturulsun</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.recurrenceEndCount}
                      onChange={(e) => setFormData({ ...formData, recurrenceEndCount: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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

          {/* Önizleme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5" />
                Önizleme ({previewDates.length} randevu)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {previewDates.slice(0, 20).map((date, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3 h-3 text-muted-foreground" />
                      <span>{date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {previewDates.length > 20 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    ... ve {previewDates.length - 20} randevu daha
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-1" />
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-1" />
              {loading ? 'Oluşturuluyor...' : `${previewDates.length} Randevu Oluştur`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 