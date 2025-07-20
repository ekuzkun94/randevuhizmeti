'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp
} from 'lucide-react';

interface CalendarStatsProps {
  events: any[];
}

export default function CalendarStats({ events }: CalendarStatsProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Bugünkü randevular
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate >= today && eventDate < tomorrow;
  });

  // Onay bekleyen randevular
  const pendingEvents = events.filter(event => 
    event.resource?.status === 'beklemede'
  );

  // Onaylanan randevular
  const approvedEvents = events.filter(event => 
    event.resource?.status === 'onaylandı'
  );

  // Tamamlanan randevular
  const completedEvents = events.filter(event => 
    event.resource?.status === 'tamamlandı'
  );

  // İptal edilen randevular
  const cancelledEvents = events.filter(event => 
    event.resource?.status === 'iptal'
  );

  const stats = [
    {
      title: 'Toplam Randevu',
      value: events.length,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Bugünkü Randevu',
      value: todayEvents.length,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Onay Bekleyen',
      value: pendingEvents.length,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Onaylanan',
      value: approvedEvents.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tamamlanan',
      value: completedEvents.length,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'İptal Edilen',
      value: cancelledEvents.length,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 