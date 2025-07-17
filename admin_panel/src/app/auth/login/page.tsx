import { AuthForm } from '@/components/forms/AuthForm'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
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
          <p className="text-gray-600">Admin Paneli Girişi</p>
        </div>

        {/* Giriş Formu */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Hoş Geldiniz
          </h2>
          <AuthForm type="login" />
          <div className="mt-6 flex justify-between text-sm">
            <Link 
              href="/auth/forgot" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Şifremi unuttum
            </Link>
            <Link 
              href="/auth/register" 
              className="text-orange-600 hover:text-orange-800 transition-colors"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 ZamanYonet. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  )
} 