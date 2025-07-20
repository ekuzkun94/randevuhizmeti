'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  Event,
  SlotInfo,
  stringOrDate,
  MoveEventArgs
} from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import tr from 'date-fns/locale/tr';
import addHours from 'date-fns/addHours';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Search,
  Eye,
  EyeOff,
  Settings,
  Download,
  RefreshCw,
  Users,
  BarChart3,
  Repeat,
  CheckSquare,
  Zap,
  Bell
} from 'lucide-react';
import AppointmentDetailModal from './AppointmentDetailModal';
import CalendarFilters from './CalendarFilters';
import CalendarViewSelector from './CalendarViewSelector';
import CalendarStats from './CalendarStats';
import QuickAppointmentModal from './QuickAppointmentModal';
import MultiCalendarView from './MultiCalendarView';
import BulkOperations from './BulkOperations';
import RecurringAppointmentModal from './RecurringAppointmentModal';
import AdvancedCalendarStats from './AdvancedCalendarStats';
import SmartScheduler from './SmartScheduler';
import NotificationManager from './NotificationManager';

const locales = {
  'tr': tr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function AppointmentCalendarBig() {
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<keyof typeof Views>('week');
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  
  // Yeni state'ler
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [showMultiCalendar, setShowMultiCalendar] = useState(false);
  const [showSmartScheduler, setShowSmartScheduler] = useState(false);
  const [showNotificationManager, setShowNotificationManager] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(new Date().setDate(new Date().getDate() + 7))
  });

  const fetchAppointments = async (currentFilters = {}) => {
    setLoading(true);
    try {
      // Filtreleri URL parametrelerine dönüştür
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value as string);
        }
      });

      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.appointments)) {
        const mapped = data.appointments.map((a) => ({
          id: a.id,
          title: `${a.customer?.name || ''} - ${a.service?.name || ''}`,
          start: new Date(a.start),
          end: new Date(a.end),
          resource: { status: a.status, note: a.note, employee: a.employee?.name },
          appointment: a
        }));
        setEvents(mapped);
      }
    } catch (e) {
      console.error('Randevular yüklenirken hata:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
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

  // Filtre değişikliği
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    fetchAppointments(newFilters);
  };

  // Sürükle-bırak event handler
  const moveEvent = async ({ event, start, end }: MoveEventArgs) => {
    try {
      console.log('Event moved:', { event, start, end });
      
      // Önce UI'yi güncelle
      const updated = events.map(ev =>
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      setEvents(updated);

      // API'ye güncelleme gönder
      const res = await fetch(`/api/appointments/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          start: start.toISOString(),
          end: end.toISOString()
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        // Hata durumunda UI'yi geri al
        setEvents(prev => prev.map(ev =>
          ev.id === event.id ? { ...ev, start: event.start, end: event.end } : ev
        ));

        // Kullanıcıya hata mesajı göster
        if (errorData.error) {
          alert(`Randevu güncellenemedi: ${errorData.error}`);
        } else {
          alert('Randevu güncellenirken bir hata oluştu');
        }
      } else {
        // Başarılı güncelleme
        console.log('Event successfully updated');
      }
    } catch (error) {
      console.error('Randevu güncellenirken hata:', error);
      
      // Hata durumunda UI'yi geri al
      setEvents(prev => prev.map(ev =>
        ev.id === event.id ? { ...ev, start: event.start, end: event.end } : ev
      ));
      
      alert('Randevu güncellenirken bir hata oluştu');
    }
  };

  // Event resize handler
  const resizeEvent = async ({ event, start, end }: MoveEventArgs) => {
    try {
      console.log('Event resized:', { event, start, end });
      
      // Önce UI'yi güncelle
      const updated = events.map(ev =>
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      setEvents(updated);

      // API'ye güncelleme gönder
      const res = await fetch(`/api/appointments/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          start: start.toISOString(),
          end: end.toISOString()
        })
      });

      if (!res.ok) {
        // Hata durumunda UI'yi geri al
        setEvents(prev => prev.map(ev =>
          ev.id === event.id ? { ...ev, start: event.start, end: event.end } : ev
        ));
        alert('Randevu güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Randevu güncellenirken hata:', error);
      
      // Hata durumunda UI'yi geri al
      setEvents(prev => prev.map(ev =>
        ev.id === event.id ? { ...ev, start: event.start, end: event.end } : ev
      ));
      
      alert('Randevu güncellenirken bir hata oluştu');
    }
  };

  // Event tıklama
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Modal kapatma
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Slot seçimi
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setIsQuickModalOpen(true);
  };

  // Hızlı randevu kaydetme
  const handleQuickSave = async (appointmentData: any) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (res.ok) {
        const newAppointment = await res.json();
        const newEvent = {
          id: newAppointment.id,
          title: `${newAppointment.customer?.name || ''} - ${newAppointment.service?.name || ''}`,
          start: new Date(newAppointment.start),
          end: new Date(newAppointment.end),
          resource: { status: newAppointment.status, note: newAppointment.note, employee: newAppointment.employee?.name },
          appointment: newAppointment
        };
        
        setEvents(prev => [...prev, newEvent]);
        setIsQuickModalOpen(false);
        setSelectedSlot(null);
      } else {
        alert('Randevu oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      console.error('Randevu oluşturulurken hata:', error);
      alert('Randevu oluşturulurken bir hata oluştu');
    }
  };

  // Durum değiştirme
  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setEvents(prev => prev.map(event => 
          event.id === id 
            ? { ...event, resource: { ...event.resource, status } }
            : event
        ));
        setSelectedEvent(prev => prev ? { ...prev, resource: { ...prev.resource, status } } : null);
      } else {
        alert('Durum güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      alert('Durum güncellenirken bir hata oluştu');
    }
  };

  // Görünüm değiştirme
  const handleViewChange = (newView: string) => {
    setView(newView as keyof typeof Views);
  };

  // Çalışan seçimi
  const handleEmployeeSelect = (employeeIds: string[]) => {
    setSelectedEmployees(employeeIds);
  };

  // Toplu durum değiştirme
  const handleBulkStatusChange = async (status: string) => {
    try {
      const promises = selectedEvents.map(event => 
        fetch(`/api/appointments/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      );

      await Promise.all(promises);
      
      setEvents(prev => prev.map(event => 
        selectedEvents.find(se => se.id === event.id)
          ? { ...event, resource: { ...event.resource, status } }
          : event
      ));
      
      setSelectedEvents([]);
    } catch (error) {
      console.error('Toplu güncelleme hatası:', error);
      alert('Toplu güncelleme sırasında bir hata oluştu');
    }
  };

  // Toplu silme
  const handleBulkDelete = async () => {
    if (!confirm(`${selectedEvents.length} randevuyu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const promises = selectedEvents.map(event => 
        fetch(`/api/appointments/${event.id}`, { method: 'DELETE' })
      );

      await Promise.all(promises);
      
      setEvents(prev => prev.filter(event => 
        !selectedEvents.find(se => se.id === event.id)
      ));
      
      setSelectedEvents([]);
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      alert('Toplu silme sırasında bir hata oluştu');
    }
  };

  // Toplu kopyalama
  const handleBulkCopy = async () => {
    try {
      const promises = selectedEvents.map(event => {
        const appointmentData = {
          customerId: event.appointment.customerId,
          serviceId: event.appointment.serviceId,
          employeeId: event.appointment.employeeId,
          start: new Date(event.start.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 gün sonra
          end: new Date(event.end.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'beklemede',
          note: event.appointment.note
        };

        return fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointmentData)
        });
      });

      const responses = await Promise.all(promises);
      const newAppointments = await Promise.all(responses.map(res => res.json()));

      const newEvents = newAppointments.map(a => ({
        id: a.id,
        title: `${a.customer?.name || ''} - ${a.service?.name || ''}`,
        start: new Date(a.start),
        end: new Date(a.end),
        resource: { status: a.status, note: a.note, employee: a.employee?.name },
        appointment: a
      }));

      setEvents(prev => [...prev, ...newEvents]);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Toplu kopyalama hatası:', error);
      alert('Toplu kopyalama sırasında bir hata oluştu');
    }
  };

  // Tümünü seç
  const handleSelectAll = () => {
    setSelectedEvents(events);
  };

  // Seçimi temizle
  const handleClearSelection = () => {
    setSelectedEvents([]);
  };

  // Tekrarlayan randevu kaydetme
  const handleRecurringSave = async (appointmentData: any) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (res.ok) {
        const newAppointment = await res.json();
        const newEvent = {
          id: newAppointment.id,
          title: `${newAppointment.customer?.name || ''} - ${newAppointment.service?.name || ''}`,
          start: new Date(newAppointment.start),
          end: new Date(newAppointment.end),
          resource: { status: newAppointment.status, note: newAppointment.note, employee: newAppointment.employee?.name },
          appointment: newAppointment
        };
        
        setEvents(prev => [...prev, newEvent]);
        setIsRecurringModalOpen(false);
        setSelectedSlot(null);
      } else {
        alert('Tekrarlayan randevu oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      console.error('Tekrarlayan randevu oluşturulurken hata:', error);
      alert('Tekrarlayan randevu oluşturulurken bir hata oluştu');
    }
  };

  // Event seçimi
  const handleEventSelect = (event: Event) => {
    setSelectedEvents(prev => {
      const isSelected = prev.find(e => e.id === event.id);
      if (isSelected) {
        return prev.filter(e => e.id !== event.id);
      } else {
        return [...prev, event];
      }
    });
  };

  // Akıllı zaman önerisi seçimi
  const handleSmartSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
    setIsQuickModalOpen(true);
  };

  // Bildirim gönderme
  const handleNotificationSend = async (notification: any) => {
    try {
      // Simüle edilmiş bildirim gönderimi
      console.log('Bildirim gönderiliyor:', notification);
      
      // Gerçek uygulamada burada API çağrısı yapılır
      // await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notification)
      // });
      
      return true;
    } catch (error) {
      console.error('Bildirim gönderilirken hata:', error);
      return false;
    }
  };

  // Event renderer - özel event görünümü
  const eventStyleGetter = (event: Event) => {
    const status = event.resource?.status;
    let backgroundColor = '#3b82f6'; // varsayılan mavi
    
    switch (status) {
      case 'onaylandı':
        backgroundColor = '#10b981'; // yeşil
        break;
      case 'beklemede':
        backgroundColor = '#f59e0b'; // turuncu
        break;
      case 'iptal':
        backgroundColor = '#ef4444'; // kırmızı
        break;
      case 'tamamlandı':
        backgroundColor = '#8b5cf6'; // mor
        break;
    }

    const isSelected = selectedEvents.find(e => e.id === event.id);
    
    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: isSelected ? '2px solid #667eea' : 'none',
        boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        fontWeight: '600',
        fontSize: '12px',
        padding: '4px 8px',
        margin: '1px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }
    };
  };

  // Özel event bileşeni
  const EventComponent = ({ event }: { event: Event }) => {
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'onaylandı': return '✓';
        case 'beklemede': return '⏳';
        case 'iptal': return '✗';
        case 'tamamlandı': return '✓';
        default: return '•';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'onaylandı': return '#10b981';
        case 'beklemede': return '#f59e0b';
        case 'iptal': return '#ef4444';
        case 'tamamlandı': return '#8b5cf6';
        default: return '#3b82f6';
      }
    };

    const isSelected = selectedEvents.find(e => e.id === event.id);

    return (
      <div
        className={`event-content ${isSelected ? 'selected-event' : ''}`}
        data-status={event.resource?.status}
        onClick={(e) => {
          e.stopPropagation();
          handleEventSelect(event);
        }}
      >
        <div 
          className="status-icon"
          style={{ 
            backgroundColor: getStatusColor(event.resource?.status),
            color: 'white',
            fontSize: '10px',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '4px',
            flexShrink: 0
          }}
        >
          {getStatusIcon(event.resource?.status)}
        </div>
        <div style={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {event.title}
        </div>
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: '12px',
            height: '12px',
            backgroundColor: '#667eea',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Randevu Takvimi</h1>
            <p className="text-gray-600 mt-1">Randevularınızı yönetin ve planlayın</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsQuickModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Hızlı Randevu
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsRecurringModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Repeat className="w-4 h-4" />
              Tekrarlayan
            </Button>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="p-6 space-y-6">
        {/* Gelişmiş Özellikler Butonları */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSmartScheduler(!showSmartScheduler)}
            className={showSmartScheduler ? 'bg-orange-50 border-orange-300 text-orange-800' : ''}
          >
            <Zap className="w-4 h-4 mr-2" />
            {showSmartScheduler ? 'Akıllı Önerileri Gizle' : 'Akıllı Öneriler'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotificationManager(!showNotificationManager)}
            className={showNotificationManager ? 'bg-red-50 border-red-300 text-red-800' : ''}
          >
            <Bell className="w-4 h-4 mr-2" />
            {showNotificationManager ? 'Bildirimleri Gizle' : 'Bildirimler'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            className={showAdvancedStats ? 'bg-blue-50 border-blue-300 text-blue-800' : ''}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showAdvancedStats ? 'İstatistikleri Gizle' : 'İstatistikler'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMultiCalendar(!showMultiCalendar)}
            className={showMultiCalendar ? 'bg-green-50 border-green-300 text-green-800' : ''}
          >
            <Users className="w-4 h-4 mr-2" />
            {showMultiCalendar ? 'Çoklu Görünümü Gizle' : 'Çoklu Takvim'}
          </Button>
        </div>

        {/* Gelişmiş Özellikler */}
        {showSmartScheduler && (
          <SmartScheduler
            events={events}
            employees={employees}
            onSlotSelect={handleSmartSlotSelect}
          />
        )}
        
        {showNotificationManager && (
          <NotificationManager
            events={events}
            onNotificationSend={handleNotificationSend}
          />
        )}

        {showAdvancedStats && (
          <AdvancedCalendarStats 
            events={events} 
            selectedDateRange={selectedDateRange}
          />
        )}
        
        {showMultiCalendar && (
          <MultiCalendarView
            events={events}
            onEmployeeSelect={handleEmployeeSelect}
            selectedEmployees={selectedEmployees}
          />
        )}
      
        {/* Toplu İşlemler */}
        <BulkOperations
          selectedEvents={selectedEvents}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkDelete={handleBulkDelete}
          onBulkCopy={handleBulkCopy}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          totalEvents={events.length}
        />
        
        {/* Temel İstatistikler */}
        <CalendarStats events={events} />
        
        {/* Takvim Kontrolleri */}
        <div className="space-y-4">
          {/* Görünüm Seçici */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <CalendarViewSelector 
              currentView={view} 
              onViewChange={handleViewChange} 
            />
          </div>
          
          {/* Filtreleme Paneli */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CalendarFilters onFiltersChange={handleFiltersChange} />
          </div>
        </div>
        
        {/* Takvim */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="relative"
            style={{ height: 700 }}
          >
            <div className="relative z-10 h-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-lg font-medium text-gray-700">Takvim yükleniyor...</div>
                    <div className="text-sm text-gray-500 mt-2">Randevularınız hazırlanıyor</div>
                  </div>
                </div>
              ) : (
                <>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'day', 'agenda']}
                    view={view}
                    onView={setView}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleEventClick}
                    resizable
                    onEventDrop={moveEvent}
                    onEventResize={resizeEvent}
                    draggableAccessor={() => true}
                    popup
                    messages={{
                      month: 'Ay',
                      week: 'Hafta',
                      day: 'Gün',
                      agenda: 'Ajanda',
                      today: 'Bugün',
                      previous: 'Geri',
                      next: 'İleri',
                      noEventsInRange: 'Bu aralıkta randevu bulunmuyor',
                      showMore: (total: number) => `+${total} daha`,
                    }}
                    eventPropGetter={eventStyleGetter}
                    components={{
                      event: EventComponent,
                      toolbar: () => null // Toolbar'ı gizle
                    }}
                    step={15}
                    timeslots={4}
                    min={new Date(0, 0, 0, 6, 0, 0)}
                    max={new Date(0, 0, 0, 22, 0, 0)}
                    className="custom-calendar"
                    tooltipAccessor={(event) => `${event.title} (${event.resource?.status})`}
                  />
                  
                  {/* Detay Modalı */}
                  <AppointmentDetailModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    appointment={selectedEvent}
                    onStatusChange={handleStatusChange}
                  />

                  {/* Hızlı Randevu Ekleme Modalı */}
                  <QuickAppointmentModal
                    isOpen={isQuickModalOpen}
                    onClose={() => setIsQuickModalOpen(false)}
                    slotInfo={selectedSlot}
                    onSave={handleQuickSave}
                  />

                  {/* Tekrarlayan Randevu Modalı */}
                  <RecurringAppointmentModal
                    isOpen={isRecurringModalOpen}
                    onClose={() => setIsRecurringModalOpen(false)}
                    slotInfo={selectedSlot}
                    onSave={handleRecurringSave}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Özel CSS stilleri */}
      <style jsx>{`
        .custom-calendar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
        }
        
        .custom-calendar .rbc-calendar {
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .custom-calendar .rbc-month-view,
        .custom-calendar .rbc-week-view,
        .custom-calendar .rbc-day-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #f8fafc;
        }
        
        .custom-calendar .rbc-toolbar {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: none;
        }
        
        .custom-calendar .rbc-toolbar button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
          margin: 0 4px;
        }
        
        .custom-calendar .rbc-toolbar button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .custom-calendar .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
        }
        
        .custom-calendar .rbc-toolbar .rbc-toolbar-label {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        /* Özel event stilleri */
        .event-content {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .event-content:hover {
          background: rgba(255,255,255,0.1);
          transform: scale(1.02);
        }
        
        .event-content.selected-event {
          background: rgba(102, 126, 234, 0.1);
          border: 2px solid #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        
        .event-content .status-icon {
          font-size: 14px;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.2);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Özel durum renkleri */
        .event-content[data-status="onaylandı"] {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%);
          border-left: 4px solid #10b981;
        }
        
        .event-content[data-status="beklemede"] {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.2) 100%);
          border-left: 4px solid #f59e0b;
        }
        
        .event-content[data-status="iptal"] {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%);
          border-left: 4px solid #ef4444;
        }
        
        .event-content[data-status="tamamlandı"] {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%);
          border-left: 4px solid #3b82f6;
        }
        
        /* Animasyonlar */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .custom-calendar {
          animation: fadeInUp 0.6s ease-out;
        }
        
        /* Responsive tasarım */
        @media (max-width: 768px) {
          .custom-calendar {
            padding: 0;
          }
          
          .custom-calendar .rbc-toolbar {
            flex-direction: column;
            gap: 10px;
            padding: 12px;
          }
          
          .custom-calendar .rbc-toolbar .rbc-toolbar-label {
            font-size: 18px;
          }
          
          .custom-calendar .rbc-month-view {
            border-radius: 8px;
          }
          
          .custom-calendar .rbc-week-view,
          .custom-calendar .rbc-day-view {
            border-radius: 8px;
          }
        }
        
        @media (max-width: 640px) {
          .custom-calendar .rbc-toolbar button {
            padding: 6px 12px;
            font-size: 12px;
          }
          
          .custom-calendar .rbc-toolbar .rbc-toolbar-label {
            font-size: 16px;
          }
        }
        
        /* Özel scroll bar */
        .custom-calendar ::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-calendar ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .custom-calendar ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
        }
        
        .custom-calendar ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }
      `}</style>
    </div>
  );
} 