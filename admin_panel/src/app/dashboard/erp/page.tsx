"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plus, Edit, Trash2, Database, Settings, Activity, CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, Building, Users, Package, DollarSign, Calendar, Shield, Globe, Mail, Phone, MapPin, Server } from "lucide-react";
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
        return <Database className="w-5 h-5 text-blue-600" />;
      case 'ORACLE':
        return <Building className="w-5 h-5 text-orange-600" />;
      case 'MICROSOFT':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'NETSUITE':
        return <Package className="w-5 h-5 text-orange-600" />;
      default:
        return <Settings className="w-5 h-5 text-gray-600" />;
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
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge variant="default" className="border-green-200">Bağlı</Badge>;
      case 'DISCONNECTED':
        return <Badge variant="secondary" className="border-gray-200">Bağlantı Yok</Badge>;
      case 'ERROR':
        return <Badge variant="destructive" className="border-red-200">Hata</Badge>;
      case 'SYNCING':
        return <Badge variant="outline" className="border-blue-200">Senkronize Ediliyor</Badge>;
      default:
        return <Badge variant="secondary" className="border-gray-200">Bilinmiyor</Badge>;
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'PENDING':
        return <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />;
      default:
        return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  const erpStats = {
    total: integrations.length,
    active: integrations.filter(i => i.isActive).length,
    connected: integrations.filter(i => i.status === 'CONNECTED').length,
    errors: integrations.reduce((sum, i) => sum + i._count.errors, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ERP Entegrasyonları"
        description="ERP sistemleri ile entegrasyonları yönetin ve senkronizasyon durumunu izleyin"
        icon={<Server className="w-6 h-6" />}
        actions={
          <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
            <Plus size={16} className="mr-2" />
            Yeni Entegrasyon
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Toplam Entegrasyon</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {erpStats.total}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <Server className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Aktif Entegrasyon</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    {erpStats.active}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bağlı Sistemler</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {erpStats.connected}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Toplam Hata</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    {erpStats.errors}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="integrations"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Entegrasyonlar
                </TabsTrigger>
                <TabsTrigger 
                  value="logs"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Senkronizasyon Logları
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Analitik
                </TabsTrigger>
              </TabsList>

              <TabsContent value="integrations" className="space-y-6 mt-6">
                {/* Filters */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">ERP Türü</label>
                        <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                        <label className="block text-sm font-medium mb-2 text-gray-700">Durum</label>
                        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                        <label className="block text-sm font-medium mb-2 text-gray-700">Aktiflik</label>
                        <Select value={filters.isActive} onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}>
                          <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                    
                    <Button 
                      onClick={fetchIntegrations} 
                      className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      Filtrele
                    </Button>
                  </CardContent>
                </Card>

                {/* Integrations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    <div className="col-span-full flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    integrations.map((integration, index) => (
                      <motion.div
                        key={integration.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="h-full hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-lg">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getERPTypeIcon(integration.type)}
                                <CardTitle className="text-lg text-gray-800">{integration.name}</CardTitle>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(integration.status)}
                                {getStatusBadge(integration.status)}
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                              {integration.description || 'Açıklama yok'}
                            </p>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Building className="w-3 h-3 text-blue-600" />
                                  Sağlayıcı
                                </span>
                                <span className="text-gray-800">{integration.provider}</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Settings className="w-3 h-3 text-orange-600" />
                                  Tür
                                </span>
                                <span className="text-gray-800">{getERPTypeName(integration.type)}</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Activity className="w-3 h-3 text-blue-600" />
                                  Versiyon
                                </span>
                                <span className="text-gray-800">{integration.version}</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-gray-600">
                                  <RefreshCw className="w-3 h-3 text-orange-600" />
                                  Senkronizasyon
                                </span>
                                <span className="text-gray-800">{Math.round(integration.syncInterval / 60)} dakika</span>
                              </div>
                            </div>
                            
                            {/* Modules */}
                            {integration.modules && integration.modules.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2 text-gray-700">Modüller:</p>
                                <div className="space-y-1">
                                  {integration.modules.slice(0, 3).map((module) => (
                                    <div key={module.id} className="flex items-center justify-between text-xs">
                                      <span className="flex items-center gap-1 text-gray-600">
                                        {getSyncStatusIcon(module.syncStatus)}
                                        {module.name}
                                      </span>
                                      <Badge variant={module.isEnabled ? 'default' : 'secondary'} className="text-xs border">
                                        {module.isEnabled ? 'Aktif' : 'Pasif'}
                                      </Badge>
                                    </div>
                                  ))}
                                  {integration.modules.length > 3 && (
                                    <p className="text-xs text-gray-500">
                                      +{integration.modules.length - 3} daha...
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1 text-gray-600">
                                <Activity className="w-3 h-3 text-blue-600" />
                                {integration._count.syncLogs} senkronizasyon
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(integration.createdAt), 'dd/MM/yyyy', { locale: tr })}
                              </span>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSyncIntegration(integration.id)}
                                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Senkronize Et
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleIntegration(integration.id, integration.isActive)}
                                className={`flex-1 ${
                                  integration.isActive 
                                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50' 
                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {integration.isActive ? 'Devre Dışı' : 'Aktifleştir'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {syncLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getSyncStatusIcon(log.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{log.module}</span>
                              <Badge variant={log.status === 'SUCCESS' ? 'default' : log.status === 'FAILED' ? 'destructive' : 'outline'} className="border">
                                {log.status === 'SUCCESS' && 'Başarılı'}
                                {log.status === 'FAILED' && 'Başarısız'}
                                {log.status === 'PENDING' && 'Beklemede'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{log.action}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{log.recordsProcessed} kayıt işlendi</span>
                              {log.duration && <span>{log.duration}ms</span>}
                              <span>{format(new Date(log.startedAt), 'dd/MM/yyyy HH:mm', { locale: tr })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4 mt-6">
                <div className="text-center py-8 text-gray-500">
                  Analitik veriler yakında eklenecek...
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Integration Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Yeni ERP Entegrasyonu Oluştur</DialogTitle>
            <DialogDescription className="text-gray-600">
              ERP sistemi ile entegrasyon kurulumu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Entegrasyon Adı</label>
                <Input
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                  placeholder="SAP Production"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Sağlayıcı</label>
                <Input
                  value={newIntegration.provider}
                  onChange={(e) => setNewIntegration({ ...newIntegration, provider: e.target.value })}
                  placeholder="SAP AG"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Açıklama</label>
              <Textarea
                value={newIntegration.description}
                onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
                placeholder="ERP entegrasyonu açıklaması"
                rows={3}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ERP Türü</label>
                <Select value={newIntegration.type} onValueChange={(value) => setNewIntegration({ ...newIntegration, type: value })}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Versiyon</label>
                <Input
                  value={newIntegration.version}
                  onChange={(e) => setNewIntegration({ ...newIntegration, version: e.target.value })}
                  placeholder="1.0.0"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Senkronizasyon (saniye)</label>
                <Input
                  type="number"
                  value={newIntegration.syncInterval}
                  onChange={(e) => setNewIntegration({ ...newIntegration, syncInterval: parseInt(e.target.value) })}
                  placeholder="3600"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                İptal
              </Button>
              <Button 
                onClick={handleCreateIntegration}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 