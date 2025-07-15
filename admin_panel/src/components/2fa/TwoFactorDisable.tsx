'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Shield, AlertTriangle } from 'lucide-react'

interface TwoFactorDisableProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TwoFactorDisable({ isOpen, onClose, onSuccess }: TwoFactorDisableProps) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDisable = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Disable failed')
      }

      onSuccess()
      onClose()
      setToken('')
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Devre dışı bırakma başarısız')
      console.error('Disable error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2FA'yı Devre Dışı Bırak
          </DialogTitle>
          <DialogDescription>
            Hesabınızın güvenliğini azaltacak. Devam etmek istediğinizden emin misiniz?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="warning" className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Güvenlik Uyarısı</p>
              <p className="text-sm">
                2FA'yı devre dışı bıraktığınızda hesabınız daha az güvenli hale gelecektir.
              </p>
            </div>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Doğrulama</CardTitle>
              <CardDescription>
                Devre dışı bırakmak için kimlik doğrulama kodunuzu girin
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
              onClick={handleDisable} 
              disabled={token.length !== 6 || loading}
              variant="destructive"
              className="flex-1"
            >
              {loading ? 'Devre Dışı Bırakılıyor...' : 'Devre Dışı Bırak'}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              İptal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 