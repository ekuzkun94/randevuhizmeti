'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Edit, 
  Save, 
  X,
  Camera,
  Shield,
  Activity,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  bio?: string
  role: string
  createdAt: string
  lastLogin: string
  avatar?: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    bio: ''
  })

  useEffect(() => {
    if (session?.user) {
      // Gerçek uygulamada API'den profil bilgileri çekilir
      setProfile({
        id: session.user.id || '1',
        name: session.user.name || 'Admin User',
        email: session.user.email || 'admin@example.com',
        phone: '+90 555 123 4567',
        address: 'İstanbul, Türkiye',
        bio: 'Sistem yöneticisi ve geliştirici',
        role: 'Admin',
        createdAt: '2024-01-15',
        lastLogin: new Date().toISOString(),
        avatar: session.user.image || ''
      })
      setEditForm({
        name: session.user.name || '',
        phone: '+90 555 123 4567',
        address: 'İstanbul, Türkiye',
        bio: 'Sistem yöneticisi ve geliştirici'
      })
      setLoading(false)
    }
  }, [session])

  const handleSave = async () => {
    try {
      // API çağrısı burada yapılır
      console.log('Profil güncelleniyor:', editForm)
      setIsEditing(false)
      // Başarı mesajı göster
    } catch (error) {
      console.error('Profil güncellenirken hata:', error)
    }
  }

  const handleCancel = () => {
    setEditForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      bio: profile?.bio || ''
    })
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Profil bilgileri yüklenemedi.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profil</h1>
          <p className="text-muted-foreground">Hesap bilgilerinizi yönetin</p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit size={16} className="mr-2" />
              Düzenle
            </Button>
          ) : (
            <>
              <Button onClick={handleSave}>
                <Save size={16} className="mr-2" />
                Kaydet
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X size={16} className="mr-2" />
                İptal
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Profil Kartı */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                >
                  <Camera size={14} />
                </Button>
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-semibold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <Badge className="mt-2">{profile.role}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar size={16} className="mr-3 text-muted-foreground" />
                  <span>Katılım: {new Date(profile.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Activity size={16} className="mr-3 text-muted-foreground" />
                  <span>Son giriş: {new Date(profile.lastLogin).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hızlı Erişim */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Hızlı Erişim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Shield size={16} className="mr-3" />
                  Güvenlik Ayarları
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Activity size={16} className="mr-3" />
                  Aktivite Geçmişi
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings size={16} className="mr-3" />
                  Hesap Ayarları
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon - Detaylar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ad Soyad</label>
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Ad soyad"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-muted rounded-md">
                      <User size={16} className="mr-3 text-muted-foreground" />
                      <span>{profile.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">E-posta</label>
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <Mail size={16} className="mr-3 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefon</label>
                  {isEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Telefon numarası"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-muted rounded-md">
                      <Phone size={16} className="mr-3 text-muted-foreground" />
                      <span>{profile.phone || 'Belirtilmemiş'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Adres</label>
                  {isEditing ? (
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Adres"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-muted rounded-md">
                      <MapPin size={16} className="mr-3 text-muted-foreground" />
                      <span>{profile.address || 'Belirtilmemiş'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hakkımda</label>
                {isEditing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Kendiniz hakkında kısa bir açıklama"
                    className="w-full p-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={4}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    <p>{profile.bio || 'Hakkımda bilgisi girilmemiş.'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 