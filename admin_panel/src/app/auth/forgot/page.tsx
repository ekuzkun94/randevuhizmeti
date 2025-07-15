'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    // API ile şifre sıfırlama isteği gönderilecek (ileride eklenecek)
    setTimeout(() => {
      setSent(true)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 card">
        <h1 className="card-title mb-4">Şifre Sıfırlama</h1>
        {sent ? (
          <Alert variant="success">E-posta gönderildi! Lütfen gelen kutunu kontrol et.</Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <Input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" disabled={loading} className="w-full">
              Sıfırlama Linki Gönder
            </Button>
          </form>
        )}
      </div>
    </div>
  )
} 