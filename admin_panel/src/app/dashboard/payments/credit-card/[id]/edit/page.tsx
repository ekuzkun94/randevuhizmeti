import { Metadata } from 'next'
import CreditCardPaymentPage from '@/components/payments/CreditCardPaymentPage'

export const metadata: Metadata = {
  title: 'Kredi Kartı Ödeme Düzenle - Admin Panel',
  description: 'Kredi kartı ödemesi düzenle',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

interface EditCreditCardPaymentPageProps {
  params: {
    id: string
  }
}

export default function EditCreditCardPaymentPageRoute({ params }: EditCreditCardPaymentPageProps) {
  return <CreditCardPaymentPage paymentId={params.id} />
} 