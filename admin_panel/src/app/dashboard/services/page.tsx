import { Metadata } from 'next'
import { ServicesPage } from '@/components/services/ServicesPage'

export const metadata: Metadata = {
  title: 'Hizmetler - Admin Panel',
  description: 'Hizmetleri yönetin ve düzenleyin',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

export default function ServicesPageRoute() {
  return <ServicesPage />
} 