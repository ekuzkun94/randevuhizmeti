import { Metadata } from 'next'
import { AppointmentsPage } from '@/components/appointments/AppointmentsPage'

export const metadata: Metadata = {
  title: 'Randevular - Admin Panel',
  description: 'Randevuları yönetin ve takvim görünümü',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

export default function AppointmentsPageRoute() {
  return <AppointmentsPage />
} 