'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  User,
  Building,
  Package,
  Save,
  X,
  Receipt
} from 'lucide-react';

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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: any) => void;
  payment?: Payment | null;
}

export default function PaymentModal({ isOpen, onClose, onSave, payment }: PaymentModalProps) {
  const [formData, setFormData] = useState({
    appointmentId: '',
    customerId: '',
    employeeId: '',
    serviceId: '',
    amount: 0,
    currency: 'TRY',
    status: 'PENDING',
    paymentMethod: 'CASH',
    transactionId: '',
    receiptNumber: '',
    notes: ''
  });

  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsRes, customersRes, employeesRes, servicesRes] = await Promise.all([
          fetch('/api/appointments?limit=100'),
          fetch('/api/customers'),
          fetch('/api/employees'),
          fetch('/api/services')
        ]);

        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setAppointments(appointmentsData.appointments || []);
        }

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.customers || []);
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          setEmployees(employeesData.employees || []);
        }

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData.services || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Form verilerini doldur
  useEffect(() => {
    if (payment) {
      setFormData({
        appointmentId: payment.appointmentId,
        customerId: payment.customerId,
        employeeId: payment.employeeId,
        serviceId: payment.serviceId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId || '',
        receiptNumber: payment.receiptNumber || '',
        notes: payment.notes || ''
      });
    } else {
      setFormData({
        appointmentId: '',
        customerId: '',
        employeeId: '',
        serviceId: '',
        amount: 0,
        currency: 'TRY',
        status: 'PENDING',
        paymentMethod: 'CASH',
        transactionId: '',
        receiptNumber: '',
        notes: ''
      });
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentChange = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setFormData(prev => ({
        ...prev,
        appointmentId,
        customerId: appointment.customerId,
        employeeId: appointment.employeeId,
        serviceId: appointment.serviceId,
        amount: appointment.service?.price || 0
      }));
    }
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP-${timestamp}-${random}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            {payment ? 'Ödeme Düzenle' : 'Yeni Ödeme'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Randevu Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="appointment">Randevu</Label>
            <Select value={formData.appointmentId} onValueChange={handleAppointmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Randevu seçin" />
              </SelectTrigger>
              <SelectContent>
                {appointments.map((appointment) => (
                  <SelectItem key={appointment.id} value={appointment.id}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {appointment.customer?.name} - {appointment.service?.name} - 
                        {new Date(appointment.start).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Müşteri ve Çalışan Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Müşteri</Label>
              <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Çalışan</Label>
              <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Çalışan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hizmet ve Tutar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service">Hizmet</Label>
              <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Hizmet seçin" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.price}₺
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Tutar</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Ödeme Yöntemi ve Durum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Nakit</SelectItem>
                  <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Banka Transferi</SelectItem>
                  <SelectItem value="ONLINE">Online Ödeme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Beklemede</SelectItem>
                  <SelectItem value="PAID">Ödendi</SelectItem>
                  <SelectItem value="FAILED">Başarısız</SelectItem>
                  <SelectItem value="REFUNDED">İade Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* İşlem Numarası ve Makbuz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">İşlem Numarası</Label>
              <Input
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                placeholder="İşlem numarası"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Makbuz Numarası</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  placeholder="Makbuz numarası"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, receiptNumber: generateReceiptNumber() })}
                >
                  <Receipt className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ödeme notları..."
              rows={3}
            />
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 