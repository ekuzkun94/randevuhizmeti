'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Calendar,
  CalendarDays,
  CalendarRange,
  List
} from 'lucide-react';

interface CalendarViewSelectorProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function CalendarViewSelector({ currentView, onViewChange }: CalendarViewSelectorProps) {
  const views = [
    {
      key: 'day',
      label: 'Gün',
      icon: Calendar,
      description: 'Günlük görünüm'
    },
    {
      key: 'week',
      label: 'Hafta',
      icon: CalendarRange,
      description: 'Haftalık görünüm'
    },
    {
      key: 'month',
      label: 'Ay',
      icon: CalendarDays,
      description: 'Aylık görünüm'
    },
    {
      key: 'agenda',
      label: 'Ajanda',
      icon: List,
      description: 'Liste görünümü'
    }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Görünüm:</span>
          <div className="flex gap-1">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = currentView === view.key;
              
              return (
                <Button
                  key={view.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onViewChange(view.key)}
                  className="flex items-center gap-1"
                  title={view.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{view.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 