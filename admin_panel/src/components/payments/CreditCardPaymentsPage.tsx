'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Shield,
  Lock,
  Calculator,
  Percent,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import PaymentFilters from './PaymentFilters';
import PaymentTable from './PaymentTable';
import Link from 'next/link';

interface CreditCardPayment {
  id: string;
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

interface CreditCardPaymentStats {
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
  averageInstallmentCount: number;
  totalInterestEarned: number;
  cardTypeDistribution: {
    visa: number;
    mastercard: number;
    amex: number;
    discover: number;
  };
  installmentDistribution: {
    single: number;
    multiple: number;
  };
}

export default function CreditCardPaymentsPage() {
  const [payments, setPayments] = useState<CreditCardPayment[]>([]);
  const [stats, setStats] = useState<CreditCardPaymentStats>({
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    paidPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    todayPayments: 0,
    todayAmount: 0,
    monthlyPayments: 0,
    monthlyAmount: 0,
    averageInstallmentCount: 0,
    totalInterestEarned: 0,
    cardTypeDistribution: {
      visa: 0,
      mastercard: 0,
      amex: 0,
      discover: 0
    },
    installmentDistribution: {
      single: 0,
      multiple: 0
    }
  });
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    cardType: 'all',
    installmentCount: 'all',
    customerId: 'all',
    employeeId: 'all',
    dateRange: 'all',
    search: ''
  });

  // Verileri yükle
  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments?method=CREDIT_CARD');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching credit card payments:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/payments/stats?method=CREDIT_CARD');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching credit card stats:', error);
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





  const handlePaymentDelete = async (paymentId: string) => {
    if (!confirm('Bu kredi kartı ödemesini silmek istediğinizden emin misiniz?')) return;

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

  // Filtreleme
  const filteredPayments = payments.filter(payment => {
    if (filters.status !== 'all' && payment.status !== filters.status) return false;
    if (filters.cardType !== 'all' && (payment.cardType || '') !== filters.cardType) return false;
    if (filters.installmentCount !== 'all') {
      const count = parseInt(filters.installmentCount);
      const installmentCount = payment.installmentCount || 1;
      if (filters.installmentCount === 'single' && installmentCount !== 1) return false;
      if (filters.installmentCount === 'multiple' && installmentCount === 1) return false;
      if (count > 1 && installmentCount !== count) return false;
    }
    if (filters.customerId !== 'all' && payment.customerId !== filters.customerId) return false;
    if (filters.employeeId !== 'all' && payment.employeeId !== filters.employeeId) return false;
    if (filters.search && !payment.customer.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Tab bazlı filtreleme
  const getTabPayments = (tab: string) => {
    switch (tab) {
      case 'pending':
        return filteredPayments.filter(p => p.status === 'PENDING');
      case 'paid':
        return filteredPayments.filter(p => p.status === 'PAID');
      case 'failed':
        return filteredPayments.filter(p => p.status === 'FAILED');
      case 'installments':
        return filteredPayments.filter(p => (p.installmentCount || 1) > 1);
      case 'single':
        return filteredPayments.filter(p => (p.installmentCount || 1) === 1);
      default:
        return filteredPayments;
    }
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

  const getCardTypeIcon = (cardType: string) => {
    if (!cardType) return '💳';
    
    switch (cardType.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'american express': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Kredi Kartı Ödemeleri"
        description="Kredi kartı ile yapılan ödemeler, taksit seçenekleri ve finansal raporlar"
        icon={<CreditCard className="h-8 w-8 text-white" />}
        actions={
          <div className="flex items-center space-x-3">
            <Link href="/dashboard/payments/credit-card/new">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kredi Kartı Ödeme
              </Button>
            </Link>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Rapor İndir
            </Button>
          </div>
        }
      />

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Toplam Kredi Kartı Ödemesi"
          value={`${stats.totalAmount.toLocaleString('tr-TR')}₺`}
          description={`${stats.totalPayments} işlem`}
          icon={<CreditCard className="h-4 w-4" />}
          trend={{
            value: 12.5,
            label: 'Geçen aya göre',
            data: [10, 15, 12, 18, 20, 25, 22]
          }}
        />
        <StatsCard
          title="Taksitli Ödemeler"
          value={`${stats.installmentDistribution?.multiple || 0}`}
          description={`${stats.totalPayments > 0 ? ((stats.installmentDistribution?.multiple || 0) / stats.totalPayments * 100).toFixed(1) : 0}% oranında`}
          icon={<Calculator className="h-4 w-4" />}
          trend={{
            value: 8.2,
            label: 'Geçen aya göre',
            data: [5, 8, 12, 15, 18, 20, 22]
          }}
        />
        <StatsCard
          title="Ortalama Taksit"
          value={`${(stats.averageInstallmentCount || 0).toFixed(1)}x`}
          description="Taksit sayısı"
          icon={<Percent className="h-4 w-4" />}
          trend={{
            value: -2.1,
            label: 'Geçen aya göre',
            data: [3.2, 3.0, 2.8, 2.9, 2.7, 2.5, 2.3]
          }}
        />
        <StatsCard
          title="Faiz Geliri"
          value={`${(stats.totalInterestEarned || 0).toLocaleString('tr-TR')}₺`}
          description="Toplam faiz geliri"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            value: 15.3,
            label: 'Geçen aya göre',
            data: [1000, 1200, 1400, 1600, 1800, 2000, 2200]
          }}
        />
      </div>

      {/* Kart Tipi Dağılımı */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Visa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cardTypeDistribution?.visa || 0}</div>
            <p className="text-xs text-gray-500">
              {stats.totalPayments > 0 ? (((stats.cardTypeDistribution?.visa || 0) / stats.totalPayments) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mastercard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cardTypeDistribution?.mastercard || 0}</div>
            <p className="text-xs text-gray-500">
              {stats.totalPayments > 0 ? (((stats.cardTypeDistribution?.mastercard || 0) / stats.totalPayments) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">American Express</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cardTypeDistribution?.amex || 0}</div>
            <p className="text-xs text-gray-500">
              {stats.totalPayments > 0 ? (((stats.cardTypeDistribution?.amex || 0) / stats.totalPayments) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Discover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cardTypeDistribution?.discover || 0}</div>
            <p className="text-xs text-gray-500">
              {stats.totalPayments > 0 ? (((stats.cardTypeDistribution?.discover || 0) / stats.totalPayments) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <PaymentFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        showCardTypeFilter={true}
        showInstallmentFilter={true}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="pending">Bekleyen</TabsTrigger>
          <TabsTrigger value="paid">Ödenen</TabsTrigger>
          <TabsTrigger value="failed">Başarısız</TabsTrigger>
          <TabsTrigger value="installments">Taksitli</TabsTrigger>
          <TabsTrigger value="single">Tek Çekim</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Ödemeler Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Kredi Kartı Ödemeleri</span>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Müşteri</th>
                      <th className="text-left p-2">Tutar</th>
                      <th className="text-left p-2">Kart Tipi</th>
                      <th className="text-left p-2">Taksit</th>
                      <th className="text-left p-2">Durum</th>
                      <th className="text-left p-2">Tarih</th>
                      <th className="text-left p-2">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTabPayments(activeTab).map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{payment.customer.name}</div>
                            <div className="text-sm text-gray-500">{payment.customer.email}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{(payment.totalAmount || payment.amount).toLocaleString('tr-TR')}₺</div>
                            {(payment.installmentCount || 1) > 1 && (
                              <div className="text-sm text-gray-500">
                                {(payment.installmentAmount || payment.amount).toFixed(2)}₺ x {payment.installmentCount || 1}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span>{getCardTypeIcon(payment.cardType || 'Unknown')}</span>
                            <span className="text-sm">{payment.cardType || 'Bilinmiyor'}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={(payment.installmentCount || 1) > 1 ? "default" : "secondary"}>
                            {payment.installmentCount || 1}x
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status === 'PAID' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {payment.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                            {payment.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            {new Date(payment.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/payments/credit-card/${payment.id}/edit`}>
                              <Button size="sm" variant="outline">
                                Düzenle
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePaymentDelete(payment.id)}
                            >
                              Sil
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


    </div>
  );
} 