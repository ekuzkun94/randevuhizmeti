import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { QuotesPage } from '@/components/quotes/QuotesPage'
import { PageHeader } from '@/components/ui/PageHeader'
import { FileText } from 'lucide-react'

export const metadata = {
  title: 'Teklifler - Admin Panel',
  description: 'Teklifleri yönetin ve PDF teklifler oluşturun',
}

export default async function QuotesPageRoute() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teklif Yönetimi"
        description="Müşteriler için profesyonel teklifler oluşturun ve yönetin"
        icon={<FileText className="h-8 w-8 text-white" />}
      />
      <QuotesPage />
    </div>
  )
} 