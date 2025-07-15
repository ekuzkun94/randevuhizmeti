import { Metadata } from 'next'
import { VersionManager } from '@/components/versioning/VersionManager'

export const metadata: Metadata = {
  title: 'Versiyon Yönetimi',
  description: 'Sistem kayıtlarının versiyon geçmişini görüntüleyin ve yönetin',
}

export default function VersionsPage() {
  return (
    <div className="container mx-auto py-6">
      <VersionManager />
    </div>
  )
} 