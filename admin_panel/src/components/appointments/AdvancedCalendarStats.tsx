'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Target,
  Award,
  Activity,
  PieChart,
  LineChart,
  CheckCircle
} from 'lucide-react';

interface AdvancedCalendarStatsProps {
  events: any[];
  selectedDateRange: { start: Date; end: Date };
}

export default function AdvancedCalendarStats({ 
  events, 
  selectedDateRange 
}: AdvancedCalendarStatsProps) {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);

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

  // Filtrelenmiş eventler
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const isInRange = eventDate >= selectedDateRange.start && eventDate <= selectedDateRange.end;
    const isEmployeeMatch = selectedEmployee === 'all' || event.appointment?.employeeId === selectedEmployee;
    return isInRange && isEmployeeMatch;
  });

  // Genel İstatistikler
  const generalStats = {
    total: filteredEvents.length,
    completed: filteredEvents.filter(e => e.resource?.status === 'tamamlandı').length,
    pending: filteredEvents.filter(e => e.resource?.status === 'beklemede').length,
    approved: filteredEvents.filter(e => e.resource?.status === 'onaylandı').length,
    cancelled: filteredEvents.filter(e => e.resource?.status === 'iptal').length,
    today: filteredEvents.filter(e => {
      const today = new Date();
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === today.toDateString();
    }).length
  };

  // Çalışan Performansı
  const employeePerformance = employees.map((employee: any) => {
    const employeeEvents = filteredEvents.filter(e => e.appointment?.employeeId === employee.id);
    const completedEvents = employeeEvents.filter(e => e.resource?.status === 'tamamlandı');
    const totalHours = employeeEvents.reduce((total, event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return {
      id: employee.id,
      name: employee.name,
      totalEvents: employeeEvents.length,
      completedEvents: completedEvents.length,
      completionRate: employeeEvents.length > 0 ? (completedEvents.length / employeeEvents.length) * 100 : 0,
      totalHours: Math.round(totalHours * 10) / 10,
      averageRating: 4.5 // Bu veri API'den gelebilir
    };
  }).sort((a, b) => b.completionRate - a.completionRate);

  // Günlük Dağılım
  const dailyDistribution = Array.from({ length: 7 }, (_, i) => {
    const dayName = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][i];
    const dayEvents = filteredEvents.filter(e => new Date(e.start).getDay() === i);
    return {
      day: dayName,
      count: dayEvents.length,
      percentage: filteredEvents.length > 0 ? (dayEvents.length / filteredEvents.length) * 100 : 0
    };
  });

  // Saatlik Dağılım
  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
    const hourEvents = filteredEvents.filter(e => new Date(e.start).getHours() === i);
    return {
      hour: i,
      count: hourEvents.length
    };
  });

  // Müşteri Analizi
  const customerAnalysis = filteredEvents.reduce((acc, event) => {
    const customerId = event.appointment?.customerId;
    if (customerId) {
      if (!acc[customerId]) {
        acc[customerId] = {
          id: customerId,
          name: event.appointment?.customer?.name || 'Bilinmeyen',
          totalAppointments: 0,
          totalHours: 0,
          lastVisit: null
        };
      }
      acc[customerId].totalAppointments++;
      const start = new Date(event.start);
      const end = new Date(event.end);
      acc[customerId].totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (!acc[customerId].lastVisit || start > new Date(acc[customerId].lastVisit)) {
        acc[customerId].lastVisit = start;
      }
    }
    return acc;
  }, {});

  const topCustomers = Object.values(customerAnalysis)
    .sort((a: any, b: any) => b.totalAppointments - a.totalAppointments)
    .slice(0, 5);

  // Gelir Analizi (örnek veri)
  const revenueAnalysis = {
    total: filteredEvents.length * 150, // Ortalama randevu ücreti
    average: filteredEvents.length > 0 ? (filteredEvents.length * 150) / filteredEvents.length : 0,
    projected: filteredEvents.length * 150 * 1.2, // %20 artış projeksiyonu
    growth: 15.5 // %15.5 büyüme
  };

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">İstatistik Filtreleri</span>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Günlük</SelectItem>
                <SelectItem value="week">Haftalık</SelectItem>
                <SelectItem value="month">Aylık</SelectItem>
                <SelectItem value="quarter">Çeyreklik</SelectItem>
                <SelectItem value="year">Yıllık</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Çalışan seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Çalışanlar</SelectItem>
                {employees.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Genel İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Randevu</p>
                <p className="text-2xl font-bold">{generalStats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamamlanan</p>
                <p className="text-2xl font-bold text-green-600">{generalStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bekleyen</p>
                <p className="text-2xl font-bold text-yellow-600">{generalStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bugün</p>
                <p className="text-2xl font-bold text-blue-600">{generalStats.today}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Gelir</p>
                <p className="text-2xl font-bold text-green-600">₺{revenueAnalysis.total.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Büyüme</p>
                <p className="text-2xl font-bold text-purple-600">+{revenueAnalysis.growth}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Çalışan Performansı */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Çalışan Performansı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeePerformance.map((employee, index) => (
              <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {employee.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.totalEvents} randevu • {employee.totalHours} saat
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Tamamlanma Oranı</p>
                    <p className="font-medium text-green-600">{employee.completionRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Ortalama Puan</p>
                    <p className="font-medium text-yellow-600">{employee.averageRating}/5</p>
                  </div>
                  {index < 3 && (
                    <Badge variant="default" className="text-xs">
                      #{index + 1}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Günlük ve Saatlik Dağılım */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Günlük Dağılım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyDistribution.map((day) => (
                <div key={day.day} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{day.day}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${day.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {day.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Saatlik Dağılım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {hourlyDistribution.map((hour) => (
                <div key={hour.hour} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{hour.hour}:00</div>
                  <div className="bg-blue-100 rounded p-1">
                    <span className="text-xs font-medium">{hour.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* En İyi Müşteriler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            En İyi Müşteriler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomers.map((customer: any, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Son ziyaret: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Toplam Randevu</p>
                    <p className="font-medium">{customer.totalAppointments}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Toplam Saat</p>
                    <p className="font-medium">{Math.round(customer.totalHours)}</p>
                  </div>
                  {index < 3 && (
                    <Badge variant="secondary" className="text-xs">
                      VIP
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 