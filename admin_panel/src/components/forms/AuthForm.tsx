'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface AuthFormProps {
  type: 'login' | 'register'
}

export function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (type === 'login') {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) setError('E-posta veya şifre hatalı')
      else window.location.href = '/dashboard'
    } else {
      // Kayıt için API çağrısı (ileride eklenecek)
      setError('Kayıt özelliği yakında!')
    }
    setLoading(false)
  }

  return (
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
      <Input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading} className="w-full">
        {type === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
      </Button>
    </form>
  )
} 