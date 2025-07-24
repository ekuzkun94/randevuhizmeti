import { Metadata } from 'next'
import CreditCardPaymentPage from '@/components/payments/CreditCardPaymentPage'

export const metadata: Metadata = {
  title: 'Yeni Kredi Kartı Ödeme - Admin Panel',
  description: 'Yeni kredi kartı ödemesi oluştur',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

export default function NewCreditCardPaymentPageRoute() {
  return <CreditCardPaymentPage />
} 