import { Metadata } from 'next'
import CreditCardPaymentsPage from '@/components/payments/CreditCardPaymentsPage'

export const metadata: Metadata = {
  title: 'Kredi Kartı Ödemeleri - Admin Panel',
  description: 'Kredi kartı ile yapılan ödemeler, taksit seçenekleri ve finansal raporlar',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

export default function CreditCardPaymentsPageRoute() {
  return <CreditCardPaymentsPage />
} 