import { AuthForm } from '@/components/forms/AuthForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 card">
        <h1 className="card-title mb-4">Kayıt Ol</h1>
        <AuthForm type="register" />
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/auth/login" className="underline">Giriş Yap</Link>
        </div>
      </div>
    </div>
  )
} 