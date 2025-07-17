'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Switch } from '@/components/ui/Switch'
import { 
  Plus, 
  Shield, 
  Users, 
  Settings, 
  Globe, 
  Key, 
  Eye, 
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  BarChart3,
  Zap
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { toast } from 'sonner'

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
        toast.success('SSO entegrasyonu başarıyla oluşturuldu')
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
      toast.error('SSO entegrasyonu oluşturulurken hata oluştu')
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GOOGLE': return <Globe className="w-5 h-5 text-red-500" />
      case 'MICROSOFT': return <Shield className="w-5 h-5 text-blue-500" />
      case 'GITHUB': return <Key className="w-5 h-5 text-gray-800" />
      case 'SLACK': return <Users className="w-5 h-5 text-purple-500" />
      default: return <Settings className="w-5 h-5 text-gray-500" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'GOOGLE': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
      case 'MICROSOFT': return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
      case 'GITHUB': return 'bg-gradient-to-r from-gray-700 to-gray-900 text-white'
      case 'SLACK': return 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
      default: return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white'
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'GOOGLE': return 'Google'
      case 'MICROSOFT': return 'Microsoft'
      case 'GITHUB': return 'GitHub'
      case 'SLACK': return 'Slack'
      default: return provider
    }
  }

  const ssoStats = {
    total: integrations.length,
    active: integrations.filter(i => i.isActive).length,
    google: integrations.filter(i => i.provider === 'GOOGLE').length,
    microsoft: integrations.filter(i => i.provider === 'MICROSOFT').length,
    github: integrations.filter(i => i.provider === 'GITHUB').length,
    slack: integrations.filter(i => i.provider === 'SLACK').length,
    totalUsers: integrations.reduce((sum, i) => sum + i._count.users, 0)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">SSO entegrasyonları yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SSO / OAuth2"
        description="Tek giriş ve kimlik doğrulama entegrasyonları"
        icon={<Shield className="w-6 h-6" />}
        actions={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
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
        }
      />

      {/* İstatistikler */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatsCard
          title="Toplam Entegrasyon"
          value={ssoStats.total}
          icon={<Shield className="w-5 h-5" />}
          gradient="from-blue-500 to-cyan-600"
          description="SSO entegrasyonları"
        />
        <StatsCard
          title="Aktif Entegrasyon"
          value={ssoStats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          gradient="from-green-500 to-emerald-600"
          description="Şu anda aktif"
        />
        <StatsCard
          title="Toplam Kullanıcı"
          value={ssoStats.totalUsers}
          icon={<Users className="w-5 h-5" />}
          gradient="from-orange-500 to-red-600"
          description="SSO ile giriş yapan"
        />
        <StatsCard
          title="Başarı Oranı"
          value={`${ssoStats.total > 0 ? Math.round((ssoStats.active / ssoStats.total) * 100) : 0}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          gradient="from-purple-500 to-pink-600"
          description="Aktif entegrasyon oranı"
        />
      </motion.div>

      {/* Sağlayıcı Dağılımı */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Sağlayıcı Dağılımı</h3>
            <p className="text-sm text-muted-foreground">SSO sağlayıcılarının kullanım oranları</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Zap size={16} />
            <span>Performans</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { provider: 'GOOGLE', count: ssoStats.google, icon: <Globe className="w-8 h-8 text-red-500" />, color: 'from-red-500 to-pink-600' },
            { provider: 'MICROSOFT', count: ssoStats.microsoft, icon: <Shield className="w-8 h-8 text-blue-500" />, color: 'from-blue-500 to-cyan-600' },
            { provider: 'GITHUB', count: ssoStats.github, icon: <Key className="w-8 h-8 text-gray-800" />, color: 'from-gray-700 to-gray-900' },
            { provider: 'SLACK', count: ssoStats.slack, icon: <Users className="w-8 h-8 text-purple-500" />, color: 'from-purple-500 to-pink-600' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-border rounded-lg hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <div>
                    <h4 className="font-medium">{getProviderName(item.provider)}</h4>
                    <p className="text-sm text-muted-foreground">{item.count} entegrasyon</p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${item.color}`}
                  style={{ width: `${ssoStats.total > 0 ? (item.count / ssoStats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Entegrasyon Listesi */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tümü ({ssoStats.total})</TabsTrigger>
          <TabsTrigger value="active">Aktif ({ssoStats.active})</TabsTrigger>
          <TabsTrigger value="google">Google ({ssoStats.google})</TabsTrigger>
          <TabsTrigger value="microsoft">Microsoft ({ssoStats.microsoft})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-orange-600 text-white">
                          {getProviderIcon(integration.provider)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">{getProviderName(integration.provider)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {integration.isActive ? (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                            <CheckCircle size={12} className="mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <AlertCircle size={12} className="mr-1" />
                            Pasif
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Kullanıcı Sayısı</span>
                        <span className="font-medium">{integration._count.users}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Oluşturulma</span>
                        <span>{new Date(integration.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Settings size={16} className="mr-1" />
                          Ayarlar
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Users size={16} className="mr-1" />
                          Kullanıcılar
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.filter(i => i.isActive).map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                          {getProviderIcon(integration.provider)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">{getProviderName(integration.provider)}</p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                        <CheckCircle size={12} className="mr-1" />
                        Aktif
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Kullanıcı Sayısı</span>
                        <span className="font-medium">{integration._count.users}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Son Güncelleme</span>
                        <span>{new Date(integration.updatedAt).toLocaleDateString('tr-TR')}</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" className="flex-1">
                          <RefreshCw size={16} className="mr-1" />
                          Yenile
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1">
                          <BarChart3 size={16} className="mr-1" />
                          Analiz
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.filter(i => i.provider === 'GOOGLE').map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 text-white">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">Google SSO</p>
                        </div>
                      </div>
                      {integration.isActive ? (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                          <CheckCircle size={12} className="mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <AlertCircle size={12} className="mr-1" />
                          Pasif
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Kullanıcı Sayısı</span>
                        <span className="font-medium">{integration._count.users}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Oluşturulma</span>
                        <span>{new Date(integration.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Settings size={16} className="mr-1" />
                          Ayarlar
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Copy size={16} className="mr-1" />
                          Kopyala
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="microsoft" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.filter(i => i.provider === 'MICROSOFT').map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">Microsoft SSO</p>
                        </div>
                      </div>
                      {integration.isActive ? (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                          <CheckCircle size={12} className="mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <AlertCircle size={12} className="mr-1" />
                          Pasif
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Kullanıcı Sayısı</span>
                        <span className="font-medium">{integration._count.users}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Oluşturulma</span>
                        <span>{new Date(integration.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Settings size={16} className="mr-1" />
                          Ayarlar
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Copy size={16} className="mr-1" />
                          Kopyala
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 