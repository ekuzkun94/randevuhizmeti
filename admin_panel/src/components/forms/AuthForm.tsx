'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

interface AuthFormProps {
  type: 'login' | 'register'
}

export function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          {error}
        </Alert>
      )}
      
      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="email"
            placeholder="E-posta adresiniz"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            className="pl-10 h-12 text-base"
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Şifreniz"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="pl-10 pr-10 h-12 text-base"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Giriş yapılıyor...
          </div>
        ) : (
          type === 'login' ? 'Giriş Yap' : 'Kayıt Ol'
        )}
      </Button>
    </form>
  )
} 