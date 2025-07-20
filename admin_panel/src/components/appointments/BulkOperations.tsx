'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  CheckSquare,
  Square,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  Calendar
} from 'lucide-react';

interface BulkOperationsProps {
  selectedEvents: any[];
  onBulkStatusChange: (status: string) => void;
  onBulkDelete: () => void;
  onBulkCopy: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  totalEvents: number;
}

export default function BulkOperations({
  selectedEvents,
  onBulkStatusChange,
  onBulkDelete,
  onBulkCopy,
  onSelectAll,
  onClearSelection,
  totalEvents
}: BulkOperationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (selectedEvents.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Toplu işlemler için randevu seçin
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="flex items-center gap-1"
            >
              <CheckSquare className="w-4 h-4" />
              Tümünü Seç ({totalEvents})
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <CheckSquare className="w-5 h-5" />
            Toplu İşlemler
            <Badge variant="secondary" className="ml-2">
              {selectedEvents.length} randevu seçili
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              {isExpanded ? 'Gizle' : 'Göster'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="flex items-center gap-1"
            >
              <Square className="w-4 h-4" />
              Seçimi Temizle
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Durum Değiştirme */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-800">Durum Değiştir</label>
              <Select onValueChange={onBulkStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beklemede">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      Beklemede
                    </div>
                  </SelectItem>
                  <SelectItem value="onaylandı">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Onaylandı
                    </div>
                  </SelectItem>
                  <SelectItem value="tamamlandı">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Tamamlandı
                    </div>
                  </SelectItem>
                  <SelectItem value="iptal">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      İptal
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kopyalama */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-800">Kopyalama</label>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkCopy}
                className="w-full flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Kopyala
              </Button>
            </div>

            {/* Silme */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-800">Silme</label>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                className="w-full flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Toplu Sil
              </Button>
            </div>

            {/* İstatistikler */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-800">Seçili Randevular</label>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Toplam:</span>
                  <span className="font-medium">{selectedEvents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bugün:</span>
                  <span className="font-medium text-green-600">
                    {selectedEvents.filter(event => {
                      const today = new Date();
                      const eventDate = new Date(event.start);
                      return eventDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Farklı Çalışan:</span>
                  <span className="font-medium">
                    {new Set(selectedEvents.map(event => event.appointment?.employeeId)).size}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seçili Randevular Listesi */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Seçili Randevular:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedEvents.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium">{event.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.start).toLocaleDateString('tr-TR')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {event.resource?.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {selectedEvents.length > 10 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  ... ve {selectedEvents.length - 10} randevu daha
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 