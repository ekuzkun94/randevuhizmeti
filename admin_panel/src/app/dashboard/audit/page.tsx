import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuditTrailManager } from '@/components/audit/AuditTrailManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { Shield, Download, Filter } from 'lucide-react'

export const metadata = {
  title: 'Audit Trail',
  description: 'Sistem aktivitelerini ve değişikliklerini takip edin',
}

export default async function AuditPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Sistem aktivitelerini ve değişikliklerini takip edin"
        icon={Shield}
        actions={[
          {
            label: 'Filtrele',
            icon: Filter,
            variant: 'outline',
            onClick: () => console.log('Filter audit logs')
          },
          {
            label: 'Dışa Aktar',
            icon: Download,
            variant: 'outline',
            onClick: () => console.log('Export audit logs')
          }
        ]}
      />
      <AuditTrailManager />
    </div>
  )
} 