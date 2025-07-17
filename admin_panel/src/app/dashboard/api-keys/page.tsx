'use client'

import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { Card } from '@/components/ui/Card'
import { 
  Key, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { ApiKeyManager } from '@/components/api-keys/ApiKeyManager'

export default function ApiKeysPage() {
  // Mock stats - gerçek uygulamada API'den gelecek
  const stats = {
    totalKeys: 12,
    activeKeys: 8,
    expiredKeys: 2,
    inactiveKeys: 2,
    totalRequests: 15420,
    averageUsage: 1285
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Anahtarları"
        description="API erişimi için anahtarlarınızı yönetin ve izleyin"
        icon={<Key className="w-6 h-6" />}
        actions={
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <BarChart3 size={16} />
              <span>{stats.totalRequests} istek</span>
            </div>
          </div>
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
          title="Toplam Anahtar"
          value={stats.totalKeys}
          icon={<Key className="w-5 h-5" />}
          gradient="from-blue-500 to-cyan-600"
          description="Oluşturulan API anahtarları"
        />
        <StatsCard
          title="Aktif Anahtar"
          value={stats.activeKeys}
          icon={<CheckCircle className="w-5 h-5" />}
          gradient="from-green-500 to-emerald-600"
          description="Şu anda kullanımda"
        />
        <StatsCard
          title="Süresi Dolmuş"
          value={stats.expiredKeys}
          icon={<Clock className="w-5 h-5" />}
          gradient="from-orange-500 to-red-600"
          description="Yenilenmesi gereken"
        />
        <StatsCard
          title="Pasif Anahtar"
          value={stats.inactiveKeys}
          icon={<AlertCircle className="w-5 h-5" />}
          gradient="from-purple-500 to-pink-600"
          description="Devre dışı bırakılan"
        />
      </motion.div>

      {/* Kullanım İstatistikleri */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">API Kullanım İstatistikleri</h3>
            <p className="text-sm text-muted-foreground">Son 30 günlük API istekleri</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <TrendingUp size={16} />
            <span>Trend</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Toplam İstek', value: stats.totalRequests, icon: <Zap className="w-8 h-8 text-blue-500" />, color: 'from-blue-500 to-cyan-600' },
            { title: 'Günlük Ortalama', value: stats.averageUsage, icon: <BarChart3 className="w-8 h-8 text-green-500" />, color: 'from-green-500 to-emerald-600' },
            { title: 'Başarı Oranı', value: '98.5%', icon: <Shield className="w-8 h-8 text-purple-500" />, color: 'from-purple-500 to-pink-600' }
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
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-orange-600">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${item.color}`}
                  style={{ width: `${index === 0 ? 85 : index === 1 ? 72 : 98}%` }}
                ></div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Ana API Key Manager Bileşeni */}
      <ApiKeyManager />
    </div>
  )
} 