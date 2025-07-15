import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuditTrailManager } from '@/components/audit/AuditTrailManager'

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
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <p className="text-muted-foreground">
          Sistem aktivitelerini ve değişikliklerini takip edin
        </p>
      </div>

      {/* Audit Trail Manager */}
      <AuditTrailManager />
    </div>
  )
} 