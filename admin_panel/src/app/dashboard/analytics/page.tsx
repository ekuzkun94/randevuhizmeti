import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Users,
  Calendar,
  Download
} from 'lucide-react'

export const metadata = {
  title: 'Analytics Dashboard',
  description: 'Sistem performansı ve kullanıcı istatistikleri',
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Sistem performansı ve kullanıcı istatistikleri"
        icon={BarChart3}
        actions={[
          {
            label: 'Rapor İndir',
            icon: Download,
            variant: 'outline',
            onClick: () => console.log('Download report')
          }
        ]}
      />
      <AnalyticsDashboard />
    </div>
  )
} 