'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Shield, QrCode, Smartphone, Key } from 'lucide-react'

interface TwoFactorSetupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface SetupData {
  secret: string
  qrCode: string
  otpauthUrl: string
}

interface BackupCodes {
  message: string
  backupCodes: string[]
}

export function TwoFactorSetup({ isOpen, onClose, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && step === 'setup') {
      setup2FA()
    }
  }, [isOpen, step])

  const setup2FA = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to setup 2FA')
      }

      const data = await response.json()
      setSetupData(data)
    } catch (error) {
      setError('2FA kurulumu başlatılamadı')
      console.error('Setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Verification failed')
      }

      const data: BackupCodes = await response.json()
      setBackupCodes(data.backupCodes)
      setStep('backup')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Doğrulama başarısız')
      console.error('Verification error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onSuccess()
    onClose()
    setStep('setup')
    setToken('')
    setError('')
    setBackupCodes([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            İki Faktörlü Kimlik Doğrulama
          </DialogTitle>
          <DialogDescription>
            Hesabınızı daha güvenli hale getirmek için 2FA'yı etkinleştirin
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">2FA kuruluyor...</p>
              </div>
            ) : setupData ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Kodu
                    </CardTitle>
                    <CardDescription>
                      Telefonunuzdaki kimlik doğrulama uygulamasıyla tarayın
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <img 
                      src={setupData.qrCode} 
                      alt="QR Code" 
                      className="mx-auto w-48 h-48"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Manuel Kurulum
                    </CardTitle>
                    <CardDescription>
                      QR kod çalışmıyorsa bu kodu manuel olarak girin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <code className="block p-2 bg-muted rounded text-xs break-all">
                      {setupData.secret}
                    </code>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => setStep('verify')} 
                    className="flex-1"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Devam Et
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                  >
                    İptal
                  </Button>
                </div>
              </>
            ) : (
              <Alert variant="error">
                {error || '2FA kurulumu başlatılamadı'}
              </Alert>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Doğrulama</CardTitle>
                <CardDescription>
                  Kimlik doğrulama uygulamanızdan 6 haneli kodu girin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
              </CardContent>
            </Card>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex gap-2">
              <Button 
                onClick={verifyAndEnable} 
                disabled={token.length !== 6 || loading}
                className="flex-1"
              >
                {loading ? 'Doğrulanıyor...' : 'Etkinleştir'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setStep('setup')}
              >
                Geri
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert variant="success">
              2FA başarıyla etkinleştirildi!
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Yedek Kodlar</CardTitle>
                <CardDescription>
                  Bu kodları güvenli bir yerde saklayın. Her kod sadece bir kez kullanılabilir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code 
                      key={index}
                      className="block p-2 bg-muted rounded text-center text-sm font-mono"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleComplete} className="w-full">
              Tamamla
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 