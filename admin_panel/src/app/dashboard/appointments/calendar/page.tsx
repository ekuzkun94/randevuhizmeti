import { Metadata } from 'next'
import { CalendarPage } from '@/components/appointments/CalendarPage'

export const metadata: Metadata = {
  title: 'Takvim - Admin Panel',
  description: 'Gelişmiş takvim görünümü ve randevu yönetimi',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

export default function CalendarPageRoute() {
  return <CalendarPage />
} 