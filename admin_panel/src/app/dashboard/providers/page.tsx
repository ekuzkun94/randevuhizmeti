import { Metadata } from 'next'
import { ProvidersPage } from '@/components/providers/ProvidersPage'

export const metadata: Metadata = {
  title: 'Hizmet Sağlayıcıları - Admin Panel',
  description: 'Hizmet sağlayıcılarını yönetin',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

export default function ProvidersPageRoute() {
  return <ProvidersPage />
} 