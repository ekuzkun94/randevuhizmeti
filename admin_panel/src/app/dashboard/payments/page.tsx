import { Metadata } from 'next'
import PaymentsPage from '@/components/payments/PaymentsPage'

export const metadata: Metadata = {
  title: 'Ödemeler - Admin Panel',
  description: 'Gelişmiş ödeme yönetimi ve fatura sistemi',
}

export default function PaymentsPageRoute() {
  return <PaymentsPage />
} 