'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { 
  Bell,
  Clock,
  Mail,
  MessageSquare,
  Settings,
  Save,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface NotificationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationManager({ isOpen, onClose }: NotificationManagerProps) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    reminderTime: '60', // dakika
    autoConfirm: false,
    customMessage: ''
  });

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Standart Hatırlatma',
      type: 'reminder',
      content: 'Sayın {customer_name}, {date} tarihinde saat {time} randevunuz bulunmaktadır.',
      isActive: true
    },
    {
      id: 2,
      name: 'Onay Talebi',
      type: 'confirmation',
      content: 'Sayın {customer_name}, randevunuzu onaylamak için lütfen yanıtlayın.',
      isActive: true
    },
    {
      id: 3,
      name: 'Değişiklik Bildirimi',
      type: 'change',
      content: 'Sayın {customer_name}, randevunuzda değişiklik yapılmıştır. Yeni zaman: {new_time}',
      isActive: false
    }
  ]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTemplateToggle = (templateId: number) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isActive: !template.isActive }
        : template
    ));
  };

  const handleSave = async () => {
    // Ayarları kaydet
    console.log('Bildirim ayarları kaydediliyor:', settings);
    console.log('Şablonlar:', templates);
    
    // Burada API çağrısı yapılabilir
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            Bildirim Yönetimi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Genel Ayarlar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Genel Ayarlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <Label>E-posta Bildirimleri</Label>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    <Label>SMS Bildirimleri</Label>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-500" />
                    <Label>Push Bildirimleri</Label>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-500" />
                    <Label>Otomatik Onay</Label>
                  </div>
                  <Switch
                    checked={settings.autoConfirm}
                    onCheckedChange={(checked) => handleSettingChange('autoConfirm', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hatırlatma Süresi</Label>
                  <Select value={settings.reminderTime} onValueChange={(value) => handleSettingChange('reminderTime', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 dakika önce</SelectItem>
                      <SelectItem value="30">30 dakika önce</SelectItem>
                      <SelectItem value="60">1 saat önce</SelectItem>
                      <SelectItem value="120">2 saat önce</SelectItem>
                      <SelectItem value="1440">1 gün önce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Özel Mesaj</Label>
                  <Input
                    value={settings.customMessage}
                    onChange={(e) => handleSettingChange('customMessage', e.target.value)}
                    placeholder="Özel bildirim mesajı..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bildirim Şablonları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Bildirim Şablonları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.type === 'reminder' && <Clock className="w-3 h-3" />}
                          {template.type === 'confirmation' && <CheckCircle className="w-3 h-3" />}
                          {template.type === 'change' && <AlertTriangle className="w-3 h-3" />}
                          {template.type}
                        </Badge>
                        <span className="font-medium">{template.name}</span>
                      </div>
                    </div>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={() => handleTemplateToggle(template.id)}
                    />
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {template.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* İstatistikler */}
          <Card>
            <CardHeader>
              <CardTitle>Bildirim İstatistikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">156</div>
                  <div className="text-sm text-gray-500">Bu Ay Gönderilen</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">142</div>
                  <div className="text-sm text-gray-500">Başarılı</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">14</div>
                  <div className="text-sm text-gray-500">Başarısız</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">89%</div>
                  <div className="text-sm text-gray-500">Açılma Oranı</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-purple-500 to-pink-500">
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 