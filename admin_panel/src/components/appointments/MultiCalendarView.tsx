'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar,
  Users,
  Eye,
  EyeOff,
  Grid,
  List,
  Filter
} from 'lucide-react';

interface MultiCalendarViewProps {
  events: any[];
  onEmployeeSelect: (employeeId: string) => void;
  selectedEmployees: string[];
}

export default function MultiCalendarView({ 
  events, 
  onEmployeeSelect, 
  selectedEmployees 
}: MultiCalendarViewProps) {
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAll, setShowAll] = useState(true);

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

  // Çalışan bazlı event sayıları
  const getEmployeeEventCount = (employeeId: string) => {
    return events.filter(event => event.appointment?.employeeId === employeeId).length;
  };

  // Bugünkü event sayısı
  const getTodayEventCount = (employeeId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter(event => {
      const eventDate = new Date(event.start);
      return event.appointment?.employeeId === employeeId && 
             eventDate >= today && 
             eventDate < tomorrow;
    }).length;
  };

  // Çalışan seçimi
  const handleEmployeeToggle = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      onEmployeeSelect(selectedEmployees.filter(id => id !== employeeId));
    } else {
      onEmployeeSelect([...selectedEmployees, employeeId]);
    }
  };

  // Tümünü göster/gizle
  const toggleShowAll = () => {
    if (showAll) {
      onEmployeeSelect([]);
    } else {
      onEmployeeSelect(employees.map((emp: any) => emp.id));
    }
    setShowAll(!showAll);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Çoklu Takvim Görünümü
            <Badge variant="secondary" className="ml-2">
              {selectedEmployees.length} seçili
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleShowAll}
              className="flex items-center gap-1"
            >
              {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAll ? 'Tümünü Gizle' : 'Tümünü Göster'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-1"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              {viewMode === 'grid' ? 'Liste' : 'Grid'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((employee: any) => {
              const isSelected = selectedEmployees.includes(employee.id);
              const totalEvents = getEmployeeEventCount(employee.id);
              const todayEvents = getTodayEventCount(employee.id);
              
              return (
                <Card 
                  key={employee.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleEmployeeToggle(employee.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.provider?.name}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Seçili
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Toplam Randevu:</span>
                        <span className="font-medium">{totalEvents}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bugün:</span>
                        <span className="font-medium text-green-600">{todayEvents}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map((employee: any) => {
              const isSelected = selectedEmployees.includes(employee.id);
              const totalEvents = getEmployeeEventCount(employee.id);
              const todayEvents = getTodayEventCount(employee.id);
              
              return (
                <div
                  key={employee.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleEmployeeToggle(employee.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {employee.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.provider?.name} • {employee.position}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Toplam</p>
                      <p className="font-medium">{totalEvents}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Bugün</p>
                      <p className="font-medium text-green-600">{todayEvents}</p>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Seçili
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 