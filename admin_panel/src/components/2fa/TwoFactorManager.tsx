'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Shield, ShieldCheck, ShieldX, Clock, Key } from 'lucide-react'
import { TwoFactorSetup } from './TwoFactorSetup'
import { TwoFactorDisable } from './TwoFactorDisable'

interface TwoFactorStatus {
  isEnabled: boolean
  isSetUp: boolean
  backupCodesCount: number
  enabledAt: string | null
  disabledAt: string | null
}

export function TwoFactorManager() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/2fa/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    fetchStatus()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            İki Faktörlü Kimlik Doğrulama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            İki Faktörlü Kimlik Doğrulama
          </CardTitle>
          <CardDescription>
            Hesabınızın güvenliğini artırmak için iki faktörlü kimlik doğrulamayı yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="font-medium">2FA Aktif</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Güvenli
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span>Yedek Kodlar: {status.backupCodesCount}</span>
                </div>
                {status.enabledAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Etkinleştirildi: {new Date(status.enabledAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDisable(true)}
                >
                  <ShieldX className="h-4 w-4 mr-2" />
                  2FA'yı Devre Dışı Bırak
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldX className="h-5 w-5 text-orange-600" />
                <span className="font-medium">2FA Devre Dışı</span>
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  Güvenlik Önerilir
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                İki faktörlü kimlik doğrulama, hesabınızı yetkisiz erişimlere karşı korur. 
                Telefonunuzdaki kimlik doğrulama uygulaması ile 6 haneli kodlar kullanarak giriş yaparsınız.
              </p>

              <Button onClick={() => setShowSetup(true)}>
                <Shield className="h-4 w-4 mr-2" />
                2FA'yı Etkinleştir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TwoFactorSetup 
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onSuccess={handleSuccess}
      />

      <TwoFactorDisable 
        isOpen={showDisable}
        onClose={() => setShowDisable(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
} 