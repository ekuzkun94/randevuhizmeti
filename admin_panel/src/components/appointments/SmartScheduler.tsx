'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Clock,
  Calendar,
  Users,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react';

interface SmartSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointmentData: any) => void;
}

export default function SmartScheduler({ 
  isOpen, 
  onClose, 
  onSave 
}: SmartSchedulerProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    note: ''
  });

  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, employeesRes, customersRes, servicesRes] = await Promise.all([
          fetch('/api/appointments?limit=100'),
          fetch('/api/employees'),
          fetch('/api/customers'),
          fetch('/api/services')
        ]);

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData.appointments || []);
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          setEmployees(employeesData.employees || []);
        }

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.customers || []);
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

  // Akıllı zaman önerileri oluştur
  const generateSmartSuggestions = () => {
    setLoading(true);
    
    const targetDate = new Date(selectedDate);
    const suggestions: any[] = [];
    
    // Çalışma saatleri (8:00 - 18:00)
    const workStart = 8;
    const workEnd = 18;
    
    // Seçili çalışanın randevularını filtrele
    const employeeEvents = selectedEmployee === 'all' 
      ? events 
      : events.filter(e => e.appointment?.employeeId === selectedEmployee);
    
    // Hedef tarihteki randevuları al
    const dayEvents = employeeEvents.filter(e => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === targetDate.toDateString();
    });
    
    // Boş zaman dilimlerini bul
    for (let hour = workStart; hour < workEnd; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + selectedDuration);
        
        // Çakışma kontrolü
        const hasConflict = dayEvents.some(event => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          return (slotStart < eventEnd && slotEnd > eventStart);
        });
        
        if (!hasConflict && slotEnd.getHours() <= workEnd) {
          // Öneri kalitesi hesapla
          const quality = calculateSlotQuality(slotStart, selectedDuration);
          
          suggestions.push({
            start: slotStart,
            end: slotEnd,
            quality,
            type: quality > 0.8 ? 'excellent' : quality > 0.6 ? 'good' : 'available'
          });
        }
      }
    }
    
    // Kaliteye göre sırala ve en iyi 10 öneriyi al
    const sortedSuggestions = suggestions
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 10);
    
    setSuggestions(sortedSuggestions);
    setLoading(false);
  };

  // Zaman dilimi kalitesi hesapla
  const calculateSlotQuality = (start: Date, duration: number) => {
    let quality = 0.5; // Temel kalite
    
    const hour = start.getHours();
    const minute = start.getMinutes();
    
    // Sabah saatleri (9-11) daha kaliteli
    if (hour >= 9 && hour <= 11) quality += 0.2;
    
    // Öğleden sonra (14-16) orta kalite
    else if (hour >= 14 && hour <= 16) quality += 0.1;
    
    // Tam saatler daha kaliteli
    if (minute === 0) quality += 0.1;
    
    // 30 dakika aralıkları
    else if (minute === 30) quality += 0.05;
    
    // Süreye göre kalite
    if (duration <= 30) quality += 0.1;
    else if (duration <= 60) quality += 0.05;
    
    return Math.min(quality, 1);
  };

  // Öneriyi seç
  const handleSuggestionSelect = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
  };

  // Randevu oluştur
  const handleCreateAppointment = async () => {
    if (!selectedSuggestion || !formData.customerId || !formData.serviceId) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const appointmentData = {
      ...formData,
      start: selectedSuggestion.start,
      end: selectedSuggestion.end,
      employeeId: selectedEmployee === 'all' ? employees[0]?.id : selectedEmployee,
      status: 'SCHEDULED'
    };

    await onSave(appointmentData);
    onClose();
  };

  // Tarih değişikliği
  const handleDateChange = (date: string) => {
    setSelectedDate(new Date(date));
  };

  useEffect(() => {
    if (events.length > 0) {
      generateSmartSuggestions();
    }
  }, [selectedEmployee, selectedDuration, selectedDate, events]);

  const getQualityIcon = (type: string) => {
    switch (type) {
      case 'excellent': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getQualityColor = (type: string) => {
    switch (type) {
      case 'excellent': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'good': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getQualityLabel = (type: string) => {
    switch (type) {
      case 'excellent': return 'Mükemmel';
      case 'good': return 'İyi';
      default: return 'Uygun';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Akıllı Zaman Önerileri
            <Badge variant="secondary" className="ml-2">
              {suggestions.length} öneri
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
        {/* Kontroller */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Çalışan Seçimi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Çalışan</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
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

          {/* Süre Seçimi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Süre</label>
            <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dakika</SelectItem>
                <SelectItem value="60">1 saat</SelectItem>
                <SelectItem value="90">1.5 saat</SelectItem>
                <SelectItem value="120">2 saat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tarih Seçimi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tarih</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Yenile Butonu */}
          <div className="space-y-2">
            <label className="text-sm font-medium">&nbsp;</label>
            <Button
              onClick={generateSmartSuggestions}
              disabled={loading}
              className="w-full"
            >
              <Target className="w-4 h-4 mr-2" />
              {loading ? 'Analiz Ediliyor...' : 'Yenile'}
            </Button>
          </div>
        </div>

        {/* Öneriler */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">En İyi Zaman Önerileri</h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Zaman analizi yapılıyor...</p>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getQualityColor(suggestion.type)}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getQualityIcon(suggestion.type)}
                      <span className="font-medium">
                        {suggestion.start.toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} - {suggestion.end.toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getQualityLabel(suggestion.type)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Kalite:</span>
                      <span className="font-medium">{(suggestion.quality * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Süre:</span>
                      <span className="font-medium">{selectedDuration} dk</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Seçilen kriterlere uygun zaman bulunamadı</p>
              <p className="text-sm text-gray-400 mt-1">Farklı bir tarih veya süre deneyin</p>
            </div>
          )}
        </div>

        {/* Seçili Öneri Detayları */}
        {selectedSuggestion && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-4">Randevu Detayları</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2 mt-4">
              <Label htmlFor="note">Not</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Randevu notu..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button onClick={handleCreateAppointment} className="bg-gradient-to-r from-blue-500 to-purple-500">
                Randevu Oluştur
              </Button>
            </div>
          </div>
        )}

        {/* İstatistikler */}
        {suggestions.length > 0 && !selectedSuggestion && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {suggestions.filter(s => s.type === 'excellent').length}
                </div>
                <div className="text-sm text-gray-500">Mükemmel</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {suggestions.filter(s => s.type === 'good').length}
                </div>
                <div className="text-sm text-gray-500">İyi</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {suggestions.filter(s => s.type === 'available').length}
                </div>
                <div className="text-sm text-gray-500">Uygun</div>
              </div>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 