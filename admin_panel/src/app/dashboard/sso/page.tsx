'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Switch } from '@/components/ui/Switch'
import { Plus, Shield, Users, Settings, Globe, Key, Eye, EyeOff } from 'lucide-react'

interface SSOIntegration {
  id: string
  name: string
  provider: string
  clientId: string
  clientSecret: string
  redirectUri?: string
  scopes: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    users: number
  }
}

export default function SSOPage() {
  const [integrations, setIntegrations] = useState<SSOIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    provider: 'GOOGLE',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [] as string[],
    isActive: false,
  })

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/sso')
      const data = await response.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error('Error fetching SSO integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createIntegration = async () => {
    try {
      const response = await fetch('/api/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIntegration,
          scopes: newIntegration.scopes,
        }),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setNewIntegration({
          name: '',
          provider: 'GOOGLE',
          clientId: '',
          clientSecret: '',
          redirectUri: '',
          scopes: [],
          isActive: false,
        })
        fetchIntegrations()
      }
    } catch (error) {
      console.error('Error creating SSO integration:', error)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GOOGLE': return <Globe className="w-4 h-4" />
      case 'MICROSOFT': return <Shield className="w-4 h-4" />
      case 'GITHUB': return <Key className="w-4 h-4" />
      case 'SLACK': return <Users className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'GOOGLE': return 'bg-red-100 text-red-800'
      case 'MICROSOFT': return 'bg-blue-100 text-blue-800'
      case 'GITHUB': return 'bg-gray-100 text-gray-800'
      case 'SLACK': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const ssoStats = {
    total: integrations.length,
    active: integrations.filter(i => i.isActive).length,
    google: integrations.filter(i => i.provider === 'GOOGLE').length,
    microsoft: integrations.filter(i => i.provider === 'MICROSOFT').length,
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SSO / OAuth2</h1>
          <p className="text-gray-600">Tek giriş ve kimlik doğrulama entegrasyonları</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Entegrasyon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni SSO Entegrasyonu Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Entegrasyon Adı</label>
                  <Input
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    placeholder="Google SSO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sağlayıcı</label>
                  <Select value={newIntegration.provider} onValueChange={(value) => setNewIntegration({ ...newIntegration, provider: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOOGLE">Google</SelectItem>
                      <SelectItem value="MICROSOFT">Microsoft</SelectItem>
                      <SelectItem value="GITHUB">GitHub</SelectItem>
                      <SelectItem value="SLACK">Slack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Client ID</label>
                <Input
                  value={newIntegration.clientId}
                  onChange={(e) => setNewIntegration({ ...newIntegration, clientId: e.target.value })}
                  placeholder="123456789-abcdef.apps.googleusercontent.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Client Secret</label>
                <div className="relative">
                  <Input
                    type={showSecret ? 'text' : 'password'}
                    value={newIntegration.clientSecret}
                    onChange={(e) => setNewIntegration({ ...newIntegration, clientSecret: e.target.value })}
                    placeholder="GOCSPX-..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Redirect URI</label>
                <Input
                  value={newIntegration.redirectUri}
                  onChange={(e) => setNewIntegration({ ...newIntegration, redirectUri: e.target.value })}
                  placeholder="https://yourdomain.com/api/auth/callback/google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">İzinler (her satıra bir izin)</label>
                <Textarea
                  value={newIntegration.scopes.join('\n')}
                  onChange={(e) => setNewIntegration({ ...newIntegration, scopes: e.target.value.split('\n').filter(scope => scope.trim()) })}
                  placeholder="openid&#10;email&#10;profile"
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newIntegration.isActive}
                  onCheckedChange={(checked) => setNewIntegration({ ...newIntegration, isActive: checked })}
                />
                <label className="text-sm font-medium">Aktif</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  İptal
                </Button>
                <Button onClick={createIntegration}>
                  Oluştur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{ssoStats.total}</div>
            <div className="text-sm text-gray-600">Toplam Entegrasyon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{ssoStats.active}</div>
            <div className="text-sm text-gray-600">Aktif Entegrasyon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{ssoStats.google}</div>
            <div className="text-sm text-gray-600">Google SSO</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{ssoStats.microsoft}</div>
            <div className="text-sm text-gray-600">Microsoft SSO</div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations List */}
      <Card>
        <CardHeader>
          <CardTitle>SSO Entegrasyonları</CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Henüz SSO entegrasyonu bulunmuyor</div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getProviderIcon(integration.provider)}
                        <h3 className="font-semibold">{integration.name}</h3>
                        <Badge className={getProviderColor(integration.provider)}>
                          {integration.provider}
                        </Badge>
                        <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                          {integration.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        <code className="bg-gray-100 px-1 rounded">{integration.clientId}</code>
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {integration._count.users} kullanıcı
                        </div>
                        <div>
                          {new Date(integration.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                        {integration.redirectUri && (
                          <div className="text-xs text-gray-400 truncate max-w-xs">
                            {integration.redirectUri}
                          </div>
                        )}
                      </div>
                      {integration.scopes && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">İzinler:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {JSON.parse(integration.scopes).map((scope: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Düzenle
                      </Button>
                      <Button variant="outline" size="sm">
                        Test Et
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 