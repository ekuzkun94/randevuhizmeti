import { Metadata } from 'next'
import { CustomersPage } from '@/components/customers/CustomersPage'

export const metadata: Metadata = {
  title: 'Müşteriler - Admin Panel',
  description: 'Müşterileri yönetin',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

export default function CustomersPageRoute() {
  return <CustomersPage />
} 