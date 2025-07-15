"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Database, Settings, Activity, CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, Building, Users, Package, DollarSign, Calendar, Shield, Globe, Mail, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

interface ERPIntegration {
  id: string;
  name: string;
  description?: string;
  type: string;
  provider: string;
  version: string;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt?: string;
  config?: any;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';
  syncInterval: number;
  createdAt: string;
  modules: Array<{
    id: string;
    name: string;
    isEnabled: boolean;
    lastSyncAt?: string;
    syncStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  }>;
  _count: {
    syncLogs: number;
    errors: number;
  };
}

interface ERPSyncLog {
  id: string;
  module: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  recordsProcessed: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  duration?: number;
}

export default function ERPPage() {
  const [integrations, setIntegrations] = useState<ERPIntegration[]>([]);
  const [syncLogs, setSyncLogs] = useState<ERPSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<ERPIntegration | null>(null);
  const [activeTab, setActiveTab] = useState<'integrations' | 'logs' | 'analytics'>('integrations');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    isActive: 'all',
  });

  const [newIntegration, setNewIntegration] = useState({
    name: '',
    description: '',
    type: 'SAP',
    provider: '',
    version: '1.0.0',
    isActive: true,
    syncInterval: 3600,
    config: '',
  });

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await fetch(`/api/erp?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setIntegrations(data.integrations.map((integration: any) => ({
          ...integration,
          config: integration.config ? JSON.parse(integration.config) : null,
        })));
      } else {
        toast.error('ERP entegrasyonları yüklenirken hata oluştu');
      }
    } catch (error) {
      toast.error('ERP entegrasyonları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const response = await fetch('/api/erp/logs');
      const data = await response.json();
      
      if (response.ok) {
        setSyncLogs(data.logs);
      }
    } catch (error) {
      console.error('Sync logs fetch error:', error);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    fetchSyncLogs();
  }, []);

  const handleCreateIntegration = async () => {
    try {
      const response = await fetch('/api/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIntegration,
          config: newIntegration.config ? JSON.parse(newIntegration.config) : null,
        }),
      });

      if (response.ok) {
        toast.success('ERP entegrasyonu başarıyla oluşturuldu');
        setShowCreateModal(false);
        setNewIntegration({
          name: '',
          description: '',
          type: 'SAP',
          provider: '',
          version: '1.0.0',
          isActive: true,
          syncInterval: 3600,
          config: '',
        });
        fetchIntegrations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'ERP entegrasyonu oluşturulurken hata oluştu');
      }
    } catch (error) {
      toast.error('ERP entegrasyonu oluşturulurken hata oluştu');
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/erp/${integrationId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Senkronizasyon başlatıldı');
        fetchIntegrations();
      } else {
        toast.error('Senkronizasyon başlatılırken hata oluştu');
      }
    } catch (error) {
      toast.error('Senkronizasyon başlatılırken hata oluştu');
    }
  };

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/erp/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(`Entegrasyon ${!isActive ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`);
        fetchIntegrations();
      } else {
        toast.error('Entegrasyon durumu güncellenirken hata oluştu');
      }
    } catch (error) {
      toast.error('Entegrasyon durumu güncellenirken hata oluştu');
    }
  };

  const getERPTypeIcon = (type: string) => {
    switch (type) {
      case 'SAP':
        return <Database className="w-5 h-5 text-blue-500" />;
      case 'ORACLE':
        return <Building className="w-5 h-5 text-red-500" />;
      case 'MICROSOFT':
        return <Globe className="w-5 h-5 text-green-500" />;
      case 'NETSUITE':
        return <Package className="w-5 h-5 text-purple-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getERPTypeName = (type: string) => {
    switch (type) {
      case 'SAP':
        return 'SAP ERP';
      case 'ORACLE':
        return 'Oracle ERP';
      case 'MICROSOFT':
        return 'Microsoft Dynamics';
      case 'NETSUITE':
        return 'NetSuite';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'DISCONNECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'SYNCING':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge variant="default">Bağlı</Badge>;
      case 'DISCONNECTED':
        return <Badge variant="secondary">Bağlantı Yok</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Hata</Badge>;
      case 'SYNCING':
        return <Badge variant="outline">Senkronize Ediliyor</Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'PENDING':
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      default:
        return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ERP Entegrasyonları</h1>
          <p className="text-muted-foreground">
            ERP sistemleri ile entegrasyonları yönetin ve senkronizasyon durumunu izleyin
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Yeni Entegrasyon
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
          <TabsTrigger value="logs">Senkronizasyon Logları</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ERP Türü</label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm türler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm türler</SelectItem>
                      <SelectItem value="SAP">SAP</SelectItem>
                      <SelectItem value="ORACLE">Oracle</SelectItem>
                      <SelectItem value="MICROSOFT">Microsoft</SelectItem>
                      <SelectItem value="NETSUITE">NetSuite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Durum</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm durumlar</SelectItem>
                      <SelectItem value="CONNECTED">Bağlı</SelectItem>
                      <SelectItem value="DISCONNECTED">Bağlantı Yok</SelectItem>
                      <SelectItem value="ERROR">Hata</SelectItem>
                      <SelectItem value="SYNCING">Senkronize Ediliyor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Aktiflik</label>
                  <Select value={filters.isActive} onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm durumlar</SelectItem>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={fetchIntegrations} className="mt-4">
                Filtrele
              </Button>
            </CardContent>
          </Card>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              integrations.map((integration) => (
                <Card key={integration.id} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getERPTypeIcon(integration.type)}
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        {getStatusBadge(integration.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {integration.description || 'Açıklama yok'}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          Sağlayıcı
                        </span>
                        <span>{integration.provider}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Settings className="w-3 h-3" />
                          Tür
                        </span>
                        <span>{getERPTypeName(integration.type)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Versiyon
                        </span>
                        <span>{integration.version}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Senkronizasyon
                        </span>
                        <span>{Math.round(integration.syncInterval / 60)} dakika</span>
                      </div>
                    </div>
                    
                    {/* Modules */}
                    {integration.modules && integration.modules.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Modüller:</p>
                        <div className="space-y-1">
                          {integration.modules.slice(0, 3).map((module) => (
                            <div key={module.id} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1">
                                {getSyncStatusIcon(module.syncStatus)}
                                {module.name}
                              </span>
                              <Badge variant={module.isEnabled ? 'default' : 'secondary'} className="text-xs">
                                {module.isEnabled ? 'Aktif' : 'Pasif'}
                              </Badge>
                            </div>
                          ))}
                          {integration.modules.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{integration.modules.length - 3} daha...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {integration._count.syncLogs} senkronizasyon
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(integration.createdAt), 'dd/MM/yyyy', { locale: tr })}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncIntegration(integration.id)}
                        className="flex items-center gap-1"
                        disabled={!integration.isActive}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Senkronize Et
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleIntegration(integration.id, integration.isActive)}
                        className="flex items-center gap-1"
                      >
                        {integration.isActive ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {integration.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Edit className="w-3 h-3" />
                        Düzenle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Senkronizasyon Logları</CardTitle>
              <CardDescription>
                ERP entegrasyonlarının senkronizasyon geçmişi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getSyncStatusIcon(log.status)}
                      <div>
                        <p className="font-medium">{log.module}</p>
                        <p className="text-sm text-muted-foreground">{log.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{log.recordsProcessed} kayıt</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.startedAt), 'dd/MM HH:mm', { locale: tr })}
                      </p>
                      {log.duration && (
                        <p className="text-xs text-muted-foreground">
                          {log.duration}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Entegrasyon</p>
                    <p className="text-2xl font-bold">{integrations.length}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktif Entegrasyon</p>
                    <p className="text-2xl font-bold">
                      {integrations.filter(i => i.isActive).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bağlı Sistem</p>
                    <p className="text-2xl font-bold">
                      {integrations.filter(i => i.status === 'CONNECTED').length}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Hata</p>
                    <p className="text-2xl font-bold">
                      {integrations.reduce((sum, i) => sum + i._count.errors, 0)}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Integration Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni ERP Entegrasyonu</DialogTitle>
            <DialogDescription>
              ERP sistemi ile yeni entegrasyon oluşturun
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Entegrasyon Adı</label>
                <Input
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ERP Entegrasyonu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">ERP Türü</label>
                <Select value={newIntegration.type} onValueChange={(value) => setNewIntegration(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAP">SAP</SelectItem>
                    <SelectItem value="ORACLE">Oracle</SelectItem>
                    <SelectItem value="MICROSOFT">Microsoft</SelectItem>
                    <SelectItem value="NETSUITE">NetSuite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <Textarea
                value={newIntegration.description}
                onChange={(e) => setNewIntegration(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Entegrasyon açıklaması..."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sağlayıcı</label>
                <Input
                  value={newIntegration.provider}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="SAP AG"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Versiyon</label>
                <Input
                  value={newIntegration.version}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Senkronizasyon (saniye)</label>
                <Input
                  type="number"
                  value={newIntegration.syncInterval}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 3600 }))}
                  placeholder="3600"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Konfigürasyon (JSON)</label>
              <Textarea
                value={newIntegration.config}
                onChange={(e) => setNewIntegration(prev => ({ ...prev, config: e.target.value }))}
                placeholder='{"host": "erp.example.com", "port": 8080, "username": "admin"}'
                rows={4}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={newIntegration.isActive}
                onChange={(e) => setNewIntegration(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <label htmlFor="isActive" className="text-sm">
                Aktif
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateIntegration}>
              Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 