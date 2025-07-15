import { AuthForm } from '@/components/forms/AuthForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 card">
        <h1 className="card-title mb-4">Giriş Yap</h1>
        <AuthForm type="login" />
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/auth/forgot" className="underline">Şifremi unuttum</Link>
          <Link href="/auth/register" className="underline">Kayıt Ol</Link>
        </div>
      </div>
    </div>
  )
} 