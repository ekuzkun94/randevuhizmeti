'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Filter,
  Search,
  X,
  RefreshCw,
  Calendar,
  User,
  Building,
  CreditCard
} from 'lucide-react';

interface PaymentFiltersProps {
  filters: {
    status: string;
    paymentMethod: string;
    customerId: string;
    employeeId: string;
    dateRange: string;
    search: string;
    cardType?: string;
    installmentCount?: string;
  };
  onFiltersChange: (filters: any) => void;
  showCardTypeFilter?: boolean;
  showInstallmentFilter?: boolean;
}

export default function PaymentFilters({ filters, onFiltersChange, showCardTypeFilter = false, showInstallmentFilter = false }: PaymentFiltersProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Müşteri ve çalışan verilerini yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, employeesRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/employees')
        ]);

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.customers || []);
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          setEmployees(employeesData.employees || []);
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      paymentMethod: 'all',
      customerId: 'all',
      employeeId: 'all',
      dateRange: 'all',
      search: '',
      cardType: 'all',
      installmentCount: 'all'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.paymentMethod !== 'all') count++;
    if (filters.customerId !== 'all') count++;
    if (filters.employeeId !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.search) count++;
    if (showCardTypeFilter && filters.cardType !== 'all') count++;
    if (showInstallmentFilter && filters.installmentCount !== 'all') count++;
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtreler
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} aktif
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={getActiveFiltersCount() === 0}
            >
              <X className="w-4 h-4 mr-2" />
              Temizle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <RefreshCw className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Temel Filtreler */}
          <div className={`grid grid-cols-1 md:grid-cols-${showCardTypeFilter || showInstallmentFilter ? '4' : '3'} gap-4`}>
            {/* Arama */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Arama</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Müşteri adı, ödeme no..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Durum */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="PENDING">Beklemede</SelectItem>
                  <SelectItem value="PAID">Ödendi</SelectItem>
                  <SelectItem value="FAILED">Başarısız</SelectItem>
                  <SelectItem value="REFUNDED">İade Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ödeme Yöntemi</label>
              <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Yöntem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="CASH">Nakit</SelectItem>
                  <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Banka Transferi</SelectItem>
                  <SelectItem value="ONLINE">Online Ödeme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kart Tipi Filtresi */}
            {showCardTypeFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Kart Tipi</label>
                <Select value={filters.cardType || 'all'} onValueChange={(value) => handleFilterChange('cardType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kart tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="American Express">American Express</SelectItem>
                    <SelectItem value="Discover">Discover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Taksit Filtresi */}
            {showInstallmentFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Taksit</label>
                <Select value={filters.installmentCount || 'all'} onValueChange={(value) => handleFilterChange('installmentCount', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Taksit seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="single">Tek Çekim</SelectItem>
                    <SelectItem value="multiple">Taksitli</SelectItem>
                    <SelectItem value="2">2 Taksit</SelectItem>
                    <SelectItem value="3">3 Taksit</SelectItem>
                    <SelectItem value="6">6 Taksit</SelectItem>
                    <SelectItem value="9">9 Taksit</SelectItem>
                    <SelectItem value="12">12 Taksit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Gelişmiş Filtreler */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {/* Müşteri */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Müşteri</label>
                <Select value={filters.customerId} onValueChange={(value) => handleFilterChange('customerId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Müşteriler</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Çalışan */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Çalışan</label>
                <Select value={filters.employeeId} onValueChange={(value) => handleFilterChange('employeeId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Çalışan seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Çalışanlar</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tarih Aralığı */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tarih Aralığı</label>
                <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tarih seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Tarihler</SelectItem>
                    <SelectItem value="today">Bugün</SelectItem>
                    <SelectItem value="yesterday">Dün</SelectItem>
                    <SelectItem value="week">Bu Hafta</SelectItem>
                    <SelectItem value="month">Bu Ay</SelectItem>
                    <SelectItem value="quarter">Bu Çeyrek</SelectItem>
                    <SelectItem value="year">Bu Yıl</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 