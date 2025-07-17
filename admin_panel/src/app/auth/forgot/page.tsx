'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Mail, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="w-full max-w-md p-8">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 relative">
              <Image
                src="/icons/zamanyonet_logo.png"
                alt="ZamanYonet Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-2">
            ZamanYonet
          </h1>
          <p className="text-gray-600">Şifre Sıfırlama</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
          <div className="mb-6">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Giriş sayfasına dön
            </Link>
            <h2 className="text-2xl font-semibold text-gray-900">
              Şifrenizi mi unuttunuz?
            </h2>
            <p className="text-gray-600 mt-2">
              E-posta adresinizi girin, size şifre sıfırlama linki göndereceğiz.
            </p>
          </div>

          {sent ? (
            <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
              <div className="text-center">
                <h3 className="font-semibold mb-2">E-posta gönderildi!</h3>
                <p>Lütfen gelen kutunuzu kontrol edin ve şifre sıfırlama linkine tıklayın.</p>
              </div>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                  {error}
                </Alert>
              )}
              
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

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Gönderiliyor...
                  </div>
                ) : (
                  'Sıfırlama Linki Gönder'
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Alt Bilgi */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 ZamanYonet. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  )
} 