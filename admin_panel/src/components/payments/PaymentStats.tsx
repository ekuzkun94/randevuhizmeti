'use client';

import { StatsCard } from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  BarChart3
} from 'lucide-react';

interface PaymentStats {
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
}

interface PaymentStatsProps {
  stats: PaymentStats;
}

export default function PaymentStats({ stats }: PaymentStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600';
      case 'PENDING': return 'text-yellow-600';
      case 'FAILED': return 'text-red-600';
      case 'REFUNDED': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'FAILED': return <XCircle className="w-4 h-4" />;
      case 'REFUNDED': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Toplam Ödemeler */}
      <StatsCard
        title="Toplam Ödemeler"
        value={formatCurrency(stats.totalAmount)}
        change={{
          value: stats.monthlyAmount > 0 ? 12.5 : -2.1,
          type: stats.monthlyAmount > 0 ? 'increase' : 'decrease',
          period: 'Bu ay'
        }}
        icon={<DollarSign className="h-4 w-4 text-green-600" />}
        trend={{
          data: [65, 78, 82, 75, 90, 85, 88, 92, 87, 95, 89, 93],
          period: 'Son 12 ay'
        }}
      />

      {/* Bugünkü Ödemeler */}
      <StatsCard
        title="Bugünkü Ödemeler"
        value={formatCurrency(stats.todayAmount)}
        change={{
          value: stats.todayAmount > 0 ? 8.2 : -5.3,
          type: stats.todayAmount > 0 ? 'increase' : 'decrease',
          period: 'Dünden'
        }}
        icon={<Calendar className="h-4 w-4 text-blue-600" />}
        trend={{
          data: [45, 52, 48, 61, 58, 55, 62, 59, 65, 68, 71, 74],
          period: 'Son 12 gün'
        }}
      />

      {/* Bu Ay Ödemeler */}
      <StatsCard
        title="Bu Ay Ödemeler"
        value={formatCurrency(stats.monthlyAmount)}
        change={{
          value: stats.monthlyAmount > 0 ? 15.7 : -3.8,
          type: stats.monthlyAmount > 0 ? 'increase' : 'decrease',
          period: 'Geçen aydan'
        }}
        icon={<BarChart3 className="h-4 w-4 text-purple-600" />}
        trend={{
          data: [1200, 1350, 1420, 1380, 1550, 1480, 1620, 1580, 1750, 1680, 1820, 1900],
          period: 'Son 12 ay'
        }}
      />

      {/* Başarı Oranı */}
      <StatsCard
        title="Başarı Oranı"
        value={`${stats.totalPayments > 0 ? Math.round((stats.paidPayments / stats.totalPayments) * 100) : 0}%`}
        change={{
          value: 2.1,
          type: 'increase',
          period: 'Geçen aydan'
        }}
        icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        trend={{
          data: [85, 87, 89, 88, 91, 90, 93, 92, 94, 93, 95, 96],
          period: 'Son 12 ay'
        }}
      />
    </div>
  );
} 