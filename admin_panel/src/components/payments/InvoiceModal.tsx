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
  Receipt, 
  DollarSign, 
  Calendar,
  User,
  Save,
  X,
  Download,
  Mail
} from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoiceData: any) => void;
}

export default function InvoiceModal({ isOpen, onClose, onSave }: InvoiceModalProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    appointmentId: '',
    amount: 0,
    taxAmount: 0,
    totalAmount: 0,
    currency: 'TRY',
    status: 'DRAFT',
    dueDate: '',
    notes: ''
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, appointmentsRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/appointments?limit=100')
        ]);

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.customers || []);
        }

        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setAppointments(appointmentsData.appointments || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentChange = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      const amount = appointment.service?.price || 0;
      const taxAmount = amount * 0.18; // %18 KDV
      const totalAmount = amount + taxAmount;

      setFormData(prev => ({
        ...prev,
        appointmentId,
        customerId: appointment.customerId,
        amount,
        taxAmount,
        totalAmount
      }));
    }
  };

  const handleAmountChange = (amount: number) => {
    const taxAmount = amount * 0.18; // %18 KDV
    const totalAmount = amount + taxAmount;

    setFormData(prev => ({
      ...prev,
      amount,
      taxAmount,
      totalAmount
    }));
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-500" />
            Yeni Fatura Oluştur
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Müşteri ve Randevu Seçimi */}
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
              <Label htmlFor="appointment">Randevu (Opsiyonel)</Label>
              <Select value={formData.appointmentId} onValueChange={handleAppointmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Randevu seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Randevu Yok</SelectItem>
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
          </div>

          {/* Tutar Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAmount">KDV (%18)</Label>
              <Input
                type="number"
                value={formData.taxAmount}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Toplam</Label>
              <Input
                type="number"
                value={formData.totalAmount}
                readOnly
                className="bg-gray-50 font-semibold"
              />
            </div>
          </div>

          {/* Durum ve Vade Tarihi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Taslak</SelectItem>
                  <SelectItem value="SENT">Gönderildi</SelectItem>
                  <SelectItem value="PAID">Ödendi</SelectItem>
                  <SelectItem value="OVERDUE">Vadesi Geçti</SelectItem>
                  <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Vade Tarihi</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Notlar */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Fatura notları..."
              rows={3}
            />
          </div>

          {/* Özet */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Fatura Özeti</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Müşteri:</span>
                <span className="font-medium">
                  {customers.find(c => c.id === formData.customerId)?.name || 'Seçilmedi'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ara Toplam:</span>
                <span>{formatCurrency(formData.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>KDV (%18):</span>
                <span>{formatCurrency(formData.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="font-medium">Toplam:</span>
                <span className="font-bold text-lg">{formatCurrency(formData.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Kaydediliyor...' : 'Fatura Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 