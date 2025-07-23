'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Filter,
  Download,
  Search,
  Calendar,
  User,
  Building,
  Receipt,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Wallet,
  Banknote,
  Globe
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import InvoiceModal from './InvoiceModal';
import PaymentFilters from './PaymentFilters';
import PaymentTable from './PaymentTable';
import PaymentStats from './PaymentStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  pendingPayments: number;
  paidPayments: number;
  failedPayments: number;
  refundedPayments: number;
  todayPayments: number;
  todayAmount: number;
  monthlyPayments: number;
  monthlyAmount: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    paidPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    todayPayments: 0,
    todayAmount: 0,
    monthlyPayments: 0,
    monthlyAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    customerId: 'all',
    employeeId: 'all',
    dateRange: 'all',
    search: ''
  });

  // Verileri yükle
  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/payments/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPayments(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleCreatePayment = () => {
    setSelectedPayment(null);
    setIsPaymentModalOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handleCreateInvoice = () => {
    setIsInvoiceModalOpen(true);
  };

  const handlePaymentSave = async (paymentData: any) => {
    try {
      const method = selectedPayment ? 'PUT' : 'POST';
      const url = selectedPayment 
        ? `/api/payments/${selectedPayment.id}` 
        : '/api/payments';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        await Promise.all([fetchPayments(), fetchStats()]);
        setIsPaymentModalOpen(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handlePaymentDelete = async (paymentId: string) => {
    if (!confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await Promise.all([fetchPayments(), fetchStats()]);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleStatusChange = async (paymentId: string, status: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await Promise.all([fetchPayments(), fetchStats()]);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filters.status !== 'all' && payment.status !== filters.status) return false;
    if (filters.paymentMethod !== 'all' && payment.paymentMethod !== filters.paymentMethod) return false;
    if (filters.customerId !== 'all' && payment.customerId !== filters.customerId) return false;
    if (filters.employeeId !== 'all' && payment.employeeId !== filters.employeeId) return false;
    if (filters.search && !payment.customer.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Tab bazlı filtreleme
  const getTabPayments = (tab: string) => {
    switch (tab) {
      case 'credit-card':
        return filteredPayments.filter(p => p.paymentMethod === 'CREDIT_CARD');
      case 'cash':
        return filteredPayments.filter(p => p.paymentMethod === 'CASH');
      case 'bank-transfer':
        return filteredPayments.filter(p => p.paymentMethod === 'BANK_TRANSFER');
      case 'online':
        return filteredPayments.filter(p => p.paymentMethod === 'ONLINE');
      default:
        return filteredPayments;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Ödeme Yönetimi"
        description="Randevu ödemeleri, faturalar ve finansal raporlar"
        icon={<CreditCard className="h-8 w-8 text-white" />}
        actions={
          <div className="flex items-center space-x-3">
            <Button onClick={handleCreatePayment} className="bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ödeme
            </Button>
            <Button onClick={handleCreateInvoice} variant="outline">
              <Receipt className="w-4 h-4 mr-2" />
              Fatura Oluştur
            </Button>
          </div>
        }
      />

      {/* İstatistikler */}
      <PaymentStats stats={stats} />

      {/* Filtreler */}
      <PaymentFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Tümü
          </TabsTrigger>
          <TabsTrigger value="credit-card" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Kredi Kartı
          </TabsTrigger>
          <TabsTrigger value="cash" className="flex items-center gap-2">
            <Banknote className="w-4 h-4" />
            Nakit
          </TabsTrigger>
          <TabsTrigger value="bank-transfer" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Banka Transferi
          </TabsTrigger>
          <TabsTrigger value="online" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Online
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Ödemeler Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {activeTab === 'all' && 'Tüm Ödemeler'}
                  {activeTab === 'credit-card' && 'Kredi Kartı Ödemeleri'}
                  {activeTab === 'cash' && 'Nakit Ödemeler'}
                  {activeTab === 'bank-transfer' && 'Banka Transferi Ödemeleri'}
                  {activeTab === 'online' && 'Online Ödemeler'}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {getTabPayments(activeTab).length} ödeme
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Dışa Aktar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTable
                payments={getTabPayments(activeTab)}
                loading={loading}
                onEdit={handleEditPayment}
                onDelete={handlePaymentDelete}
                onStatusChange={handleStatusChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modaller */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        onSave={handlePaymentSave}
        payment={selectedPayment}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSave={() => {
          setIsInvoiceModalOpen(false);
          // Fatura oluşturma işlemi
        }}
      />
    </div>
  );
} 