'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Filter, 
  X, 
  Calendar,
  User,
  Building,
  Search,
  RefreshCw,
  Briefcase
} from 'lucide-react';

interface CalendarFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function CalendarFilters({ onFiltersChange }: CalendarFiltersProps) {
  const [filters, setFilters] = useState({
    employeeId: 'all',
    customerId: 'all',
    serviceId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Filtreleri uygula
  const applyFilters = () => {
    // "all" değerlerini boş string'e çevir
    const processedFilters = {
      ...filters,
      employeeId: filters.employeeId === 'all' ? '' : filters.employeeId,
      customerId: filters.customerId === 'all' ? '' : filters.customerId,
      serviceId: filters.serviceId === 'all' ? '' : filters.serviceId,
      status: filters.status === 'all' ? '' : filters.status
    };
    onFiltersChange(processedFilters);
  };

  // Filtreleri temizle
  const clearFilters = () => {
    const clearedFilters = {
      employeeId: 'all',
      customerId: 'all',
      serviceId: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    };
    setFilters(clearedFilters);
    onFiltersChange({
      employeeId: '',
      customerId: '',
      serviceId: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  // Filtre değişikliği
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Aktif filtre sayısı
  const activeFiltersCount = Object.values(filters).filter(value => value !== '' && value !== 'all').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtreler
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} aktif
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Çalışan Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Building className="w-4 h-4" />
              Çalışan
            </label>
            <Select value={filters.employeeId} onValueChange={(value) => handleFilterChange('employeeId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm çalışanlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm çalışanlar</SelectItem>
                {employees.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Müşteri Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <User className="w-4 h-4" />
              Müşteri
            </label>
            <Select value={filters.customerId} onValueChange={(value) => handleFilterChange('customerId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm müşteriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm müşteriler</SelectItem>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hizmet Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              Hizmet
            </label>
            <Select value={filters.serviceId} onValueChange={(value) => handleFilterChange('serviceId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm hizmetler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm hizmetler</SelectItem>
                {services.map((service: any) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Durum Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Durum</label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                <SelectItem value="beklemede">Beklemede</SelectItem>
                <SelectItem value="onaylandı">Onaylandı</SelectItem>
                <SelectItem value="tamamlandı">Tamamlandı</SelectItem>
                <SelectItem value="iptal">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Başlangıç Tarihi */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Başlangıç
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="Başlangıç tarihi"
            />
          </div>

          {/* Bitiş Tarihi */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Bitiş
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              placeholder="Bitiş tarihi"
            />
          </div>

          {/* Arama */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Search className="w-4 h-4" />
              Arama
            </label>
            <Input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Müşteri, hizmet..."
            />
          </div>
        </div>

        {/* Filtre Butonları */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button onClick={applyFilters} className="flex items-center gap-2 px-6">
            <Filter className="w-4 h-4" />
            Filtrele
          </Button>
          <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 px-6">
            <X className="w-4 h-4" />
            Temizle
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="flex items-center gap-2 px-6">
            <RefreshCw className="w-4 h-4" />
            Yenile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 