'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  User,
  Building,
  Package,
  Save,
  ArrowLeft,
  Receipt,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface CreditCardPayment {
  id?: string;
  appointmentId: string;
  customerId: string;
  employeeId: string;
  serviceId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: 'CREDIT_CARD';
  transactionId?: string;
  receiptNumber?: string;
  notes?: string;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  installmentCount: number;
  installmentAmount: number;
  totalAmount: number;
  interestRate: number;
  bankName: string;
  cardType: string;
  paidAt?: Date;
  createdAt?: Date;
}

interface CreditCardPaymentPageProps {
  paymentId?: string;
}

export default function CreditCardPaymentPage({ paymentId }: CreditCardPaymentPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreditCardPayment>({
    appointmentId: '',
    customerId: '',
    employeeId: '',
    serviceId: '',
    amount: 0,
    currency: 'TRY',
    status: 'PENDING',
    paymentMethod: 'CREDIT_CARD',
    transactionId: '',
    receiptNumber: '',
    notes: '',
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    installmentCount: 1,
    installmentAmount: 0,
    totalAmount: 0,
    interestRate: 0,
    bankName: '',
    cardType: ''
  });

  const [showCvv, setShowCvv] = useState(false);
  const [cardValidation, setCardValidation] = useState({
    isValid: false,
    cardType: '',
    bankName: ''
  });
  const [installmentOptions, setInstallmentOptions] = useState<Array<{
    count: number;
    amount: number;
    total: number;
    interestRate: number;
  }>>([]);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

        // Eğer düzenleme modundaysa, ödeme verilerini yükle
        if (paymentId) {
          const paymentRes = await fetch(`/api/payments/${paymentId}`);
          if (paymentRes.ok) {
            const paymentData = await paymentRes.json();
            setFormData(paymentData);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [paymentId]);

  // Kart numarası validasyonu
  const validateCardNumber = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    // Luhn algoritması
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    const isValid = sum % 10 === 0;
    
    // Kart tipi belirleme
    let cardType = '';
    let bankName = '';
    
    if (cleanNumber.startsWith('4')) {
      cardType = 'Visa';
      bankName = 'Visa';
    } else if (cleanNumber.startsWith('5')) {
      cardType = 'Mastercard';
      bankName = 'Mastercard';
    } else if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) {
      cardType = 'American Express';
      bankName = 'American Express';
    } else if (cleanNumber.startsWith('6')) {
      cardType = 'Discover';
      bankName = 'Discover';
    }
    
    setCardValidation({ isValid, cardType, bankName });
    setFormData(prev => ({ ...prev, cardType, bankName }));
    
    return isValid;
  };

  // Taksit seçeneklerini hesapla
  const calculateInstallments = (amount: number) => {
    const options = [];
    
    for (let i = 1; i <= 12; i++) {
      let interestRate = 0;
      let total = amount;
      
      if (i > 1) {
        // Basit faiz hesaplama (gerçek uygulamada daha karmaşık olabilir)
        interestRate = i <= 3 ? 0 : (i - 1) * 0.5; // %0.5 aylık faiz
        total = amount * (1 + interestRate / 100);
      }
      
      options.push({
        count: i,
        amount: total / i,
        total: total,
        interestRate: interestRate
      });
    }
    
    setInstallmentOptions(options);
  };

  // Tutar değiştiğinde taksit seçeneklerini güncelle
  useEffect(() => {
    if (formData.amount > 0) {
      calculateInstallments(formData.amount);
    }
  }, [formData.amount]);

  // Taksit seçildiğinde tutarları güncelle
  const handleInstallmentChange = (count: number) => {
    const option = installmentOptions.find(opt => opt.count === count);
    if (option) {
      setFormData(prev => ({
        ...prev,
        installmentCount: count,
        installmentAmount: option.amount,
        totalAmount: option.total,
        interestRate: option.interestRate
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Kart validasyonu
      if (!validateCardNumber(formData.cardNumber)) {
        alert('Geçersiz kart numarası!');
        setLoading(false);
        return;
      }

      if (formData.cvv.length < 3) {
        alert('Geçersiz CVV!');
        setLoading(false);
        return;
      }

      const method = paymentId ? 'PUT' : 'POST';
      const url = paymentId 
        ? `/api/payments/${paymentId}` 
        : '/api/payments';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Başarılı kayıt sonrası kredi kartı ödemeleri sayfasına yönlendir
        router.push('/dashboard/payments/credit-card');
      } else {
        alert('Ödeme kaydedilirken bir hata oluştu!');
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Ödeme kaydedilirken bir hata oluştu!');
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
    return `CC-${timestamp}-${random}`;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={paymentId ? 'Kredi Kartı Ödeme Düzenle' : 'Yeni Kredi Kartı Ödeme'}
        description={paymentId ? 'Kredi kartı ödeme bilgilerini düzenleyin' : 'Yeni kredi kartı ödemesi oluşturun'}
        icon={<CreditCard className="h-8 w-8 text-white" />}
        actions={
          <div className="flex items-center space-x-3">
            <Link href="/dashboard/payments/credit-card">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Button>
            </Link>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Randevu Seçimi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Randevu Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Kredi Kartı Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              Kredi Kartı Bilgileri
              {cardValidation.isValid && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Geçerli
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Kart Numarası</Label>
                <Input
                  value={formData.cardNumber}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value);
                    setFormData({ ...formData, cardNumber: formatted });
                    validateCardNumber(formatted);
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                {cardValidation.cardType && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    {cardValidation.cardType} - {cardValidation.bankName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardHolderName">Kart Sahibi</Label>
                <Input
                  value={formData.cardHolderName}
                  onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value.toUpperCase() })}
                  placeholder="AD SOYAD"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth">Son Kullanma Ay</Label>
                <Select value={formData.expiryMonth} onValueChange={(value) => setFormData({ ...formData, expiryMonth: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ay" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                        {month.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryYear">Son Kullanma Yıl</Label>
                <Select value={formData.expiryYear} onValueChange={(value) => setFormData({ ...formData, expiryYear: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yıl" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Input
                    type={showCvv ? "text" : "password"}
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="123"
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowCvv(!showCvv)}
                  >
                    {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taksit Seçenekleri */}
        {formData.amount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-500" />
                Taksit Seçenekleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {installmentOptions.slice(0, 6).map((option) => (
                  <div
                    key={option.count}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.installmentCount === option.count
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInstallmentChange(option.count)}
                  >
                    <div className="text-center">
                      <div className="font-semibold text-lg">{option.count}x</div>
                      <div className="text-sm text-gray-600">
                        {option.amount.toFixed(2)}₺
                      </div>
                      {option.interestRate > 0 && (
                        <div className="text-xs text-red-600">
                          +%{option.interestRate}
                        </div>
                      )}
                      <div className="text-xs font-medium text-gray-800">
                        Toplam: {option.total.toFixed(2)}₺
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ödeme Özeti */}
        {formData.installmentCount > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-green-500" />
                Ödeme Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Orijinal Tutar</div>
                  <div className="text-lg font-semibold">{formData.amount.toFixed(2)}₺</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Taksit Sayısı</div>
                  <div className="text-lg font-semibold">{formData.installmentCount}x</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Toplam Tutar</div>
                  <div className="text-lg font-semibold">{formData.totalAmount.toFixed(2)}₺</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* İşlem Numarası ve Makbuz */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" />
              İşlem Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Link href="/dashboard/payments/credit-card">
            <Button type="button" variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !cardValidation.isValid}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Kaydediliyor...' : (paymentId ? 'Güncelle' : 'Ödemeyi Tamamla')}
          </Button>
        </div>
      </form>
    </div>
  );
} 