"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TwoFactorManager } from '@/components/2fa/TwoFactorManager'
import { 
  Settings, 
  Save, 
  Globe, 
  Bell, 
  Shield,
  Database,
  Mail,
  Palette
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'

type SettingsTab = 'general' | 'notifications' | 'security' | 'database' | 'email' | 'theme'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // State for custom selects
  const [defaultLang, setDefaultLang] = useState('tr')
  const [timezone, setTimezone] = useState('Europe/Istanbul')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [themeMode, setThemeMode] = useState('light')

  const tabs = [
    { id: 'general', label: 'Genel Ayarlar', icon: Globe },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'security', label: 'Güvenlik', icon: Shield },
    { id: 'database', label: 'Veritabanı', icon: Database },
    { id: 'email', label: 'E-posta', icon: Mail },
    { id: 'theme', label: 'Tema', icon: Palette },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Genel Ayarlar</h2>
              <p className="card-description">Sistem genel ayarlarını yapılandırın</p>
            </div>
            <div className="card-content">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Uygulama Adı</label>
                    <Input defaultValue="Modern Admin Panel" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Varsayılan Dil</label>
                    <Select value={defaultLang} onValueChange={setDefaultLang}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Zaman Dilimi</label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Istanbul">İstanbul (UTC+3)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tarih Formatı</label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Açıklama</label>
                  <textarea 
                    className="input min-h-[100px]"
                    placeholder="Sistem açıklaması..."
                    defaultValue="Modern ve güvenli admin paneli uygulaması"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">İptal</Button>
                  <Button>
                    <Save size={16} className="mr-2" />
                    Kaydet
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )
      
      case 'notifications':
        return (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Bildirim Ayarları</h2>
              <p className="card-description">Bildirim tercihlerinizi yapılandırın</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">E-posta Bildirimleri</h3>
                    <p className="text-sm text-muted-foreground">Önemli olaylar için e-posta alın</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Bildirimleri</h3>
                    <p className="text-sm text-muted-foreground">Tarayıcı push bildirimleri</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SMS Bildirimleri</h3>
                    <p className="text-sm text-muted-foreground">Acil durumlar için SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <TwoFactorManager />
            
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Güvenlik Ayarları</h2>
                <p className="card-description">Hesap güvenliğinizi yönetin</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Oturum Zaman Aşımı</h3>
                      <p className="text-sm text-muted-foreground">30 dakika sonra otomatik çıkış</p>
                    </div>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select session timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 dakika</SelectItem>
                        <SelectItem value="30">30 dakika</SelectItem>
                        <SelectItem value="60">1 saat</SelectItem>
                        <SelectItem value="120">2 saat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Şifre Değiştirme</h3>
                      <p className="text-sm text-muted-foreground">Şifrenizi güvenli bir şekilde değiştirin</p>
                    </div>
                    <Button variant="outline">Değiştir</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Aktif Oturumlar</h3>
                      <p className="text-sm text-muted-foreground">Tüm cihazlardan çıkış yapın</p>
                    </div>
                    <Button variant="outline">Çıkış Yap</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'database':
        return (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Veritabanı Yönetimi</h2>
              <p className="card-description">Veritabanı işlemlerini yönetin</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Veritabanı Durumu</h3>
                    <p className="text-sm text-muted-foreground">Bağlantı: Aktif</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Çevrimiçi</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Yedekleme</h3>
                    <p className="text-sm text-muted-foreground">Son yedekleme: 2 saat önce</p>
                  </div>
                  <Button variant="outline">Yedekle</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Optimizasyon</h3>
                    <p className="text-sm text-muted-foreground">Veritabanını optimize edin</p>
                  </div>
                  <Button variant="outline">Optimize Et</Button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'email':
        return (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">E-posta Ayarları</h2>
              <p className="card-description">E-posta sunucu ayarlarını yapılandırın</p>
            </div>
            <div className="card-content">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Sunucu</label>
                    <Input defaultValue="smtp.gmail.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Port</label>
                    <Input defaultValue="587" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">E-posta</label>
                    <Input defaultValue="noreply@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Şifre</label>
                    <Input type="password" defaultValue="********" />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Test Et</Button>
                  <Button>
                    <Save size={16} className="mr-2" />
                    Kaydet
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )

      case 'theme':
        return (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Tema Ayarları</h2>
              <p className="card-description">Görünüm tercihlerinizi özelleştirin</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tema Modu</label>
                  <Select value={themeMode} onValueChange={setThemeMode}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select theme mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Açık</SelectItem>
                      <SelectItem value="dark">Koyu</SelectItem>
                      <SelectItem value="auto">Otomatik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Renk Şeması</label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <button className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">Mavi</button>
                    <button className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">Gri</button>
                    <button className="p-4 border-2 border-gray-300 rounded-lg bg-green-50">Yeşil</button>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Sıfırla</Button>
                  <Button>
                    <Save size={16} className="mr-2" />
                    Kaydet
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">Sistem ayarlarını yapılandırın</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Menü */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-content">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full text-left p-3 rounded-md flex items-center transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-accent'
                      }`}
                    >
                      <Icon size={16} className="mr-2" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Sağ İçerik */}
        <div className="lg:col-span-2">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
} 