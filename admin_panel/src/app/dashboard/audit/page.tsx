import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuditTrailManager } from '@/components/audit/AuditTrailManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { Shield } from 'lucide-react'

export const metadata = {
  title: 'Audit Trail - Admin Panel',
  description: 'Sistem aktivitelerini ve değişikliklerini takip edin',
}

export default async function AuditPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  // Allow all authenticated users to access audit trail for now
  // if (session.user.role !== 'ADMIN') {
  //   redirect('/dashboard')
  // }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Sistem aktivitelerini ve değişikliklerini takip edin"
        icon={<Shield className="h-8 w-8 text-white" />}
      />
      <AuditTrailManager />
    </div>
  )
} 