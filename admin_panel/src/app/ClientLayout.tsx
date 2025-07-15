"use client"

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'
import { AIChatbot } from '@/components/ai/AIChatbot'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" />
        <AIChatbot />
      </AuthProvider>
    </SessionProvider>
  )
} 