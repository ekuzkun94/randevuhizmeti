'use client'

import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { Card } from '@/components/ui/Card'
import { 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star,
  Zap,
  TrendingUp,
  Shield,
  Database,
  Globe,
  Users,
  Settings
} from 'lucide-react'
import { ModuleManager } from '@/components/licensing/ModuleManager'

export default function ModulesPage() {
  // Mock stats - gerçek uygulamada API'den gelecek
  const stats = {
    totalModules: 18,
    activeModules: 12,
    expiredModules: 3,
    inactiveModules: 3,
    premiumModules: 8,
    totalLicenses: 24,
    averageRating: 4.3
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
        title="Modül Yönetimi"
        description="Sistem modüllerini ve lisanslarını yönetin"
        icon={<Package className="w-6 h-6" />}
        actions={
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Star size={16} className="text-yellow-500" />
              <span>{stats.averageRating}</span>
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
          title="Toplam Modül"
          value={stats.totalModules}
          icon={<Package className="w-5 h-5" />}
          gradient="from-blue-500 to-cyan-600"
          description="Sistemdeki modüller"
        />
        <StatsCard
          title="Aktif Modül"
          value={stats.activeModules}
          icon={<CheckCircle className="w-5 h-5" />}
          gradient="from-green-500 to-emerald-600"
          description="Şu anda aktif"
        />
        <StatsCard
          title="Premium Modül"
          value={stats.premiumModules}
          icon={<Star className="w-5 h-5" />}
          gradient="from-purple-500 to-pink-600"
          description="Premium özellikler"
        />
        <StatsCard
          title="Toplam Lisans"
          value={stats.totalLicenses}
          icon={<Shield className="w-5 h-5" />}
          gradient="from-orange-500 to-red-600"
          description="Aktif lisanslar"
        />
      </motion.div>

      {/* Modül Kategorileri */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Modül Kategorileri</h3>
            <p className="text-sm text-muted-foreground">Modüllerin kategorilere göre dağılımı</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <TrendingUp size={16} />
            <span>Popüler</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Güvenlik', count: 4, icon: <Shield className="w-8 h-8 text-red-500" />, color: 'from-red-500 to-pink-600', active: 3 },
            { name: 'Veritabanı', count: 3, icon: <Database className="w-8 h-8 text-blue-500" />, color: 'from-blue-500 to-cyan-600', active: 2 },
            { name: 'İletişim', count: 5, icon: <Globe className="w-8 h-8 text-green-500" />, color: 'from-green-500 to-emerald-600', active: 4 },
            { name: 'Kullanıcı', count: 6, icon: <Users className="w-8 h-8 text-purple-500" />, color: 'from-purple-500 to-pink-600', active: 5 }
          ].map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-border rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {category.icon}
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-muted-foreground">{category.count} modül</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Aktif: {category.active}</span>
                  <span className="text-muted-foreground">Pasif: {category.count - category.active}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${category.color}`}
                    style={{ width: `${(category.active / category.count) * 100}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Öne Çıkan Modüller */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Öne Çıkan Modüller</h3>
            <p className="text-sm text-muted-foreground">En popüler ve yeni modüller</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Zap size={16} />
            <span>Trending</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Advanced Security', category: 'Güvenlik', icon: <Shield className="w-8 h-8 text-red-500" />, rating: 4.9, downloads: 1240, premium: true },
            { name: 'Database Manager', category: 'Veritabanı', icon: <Database className="w-8 h-8 text-blue-500" />, rating: 4.7, downloads: 890, premium: false },
            { name: 'Communication Hub', category: 'İletişim', icon: <Globe className="w-8 h-8 text-green-500" />, rating: 4.8, downloads: 1560, premium: true }
          ].map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-border rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {module.icon}
                  <div>
                    <h4 className="font-medium">{module.name}</h4>
                    <p className="text-sm text-muted-foreground">{module.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{module.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{module.downloads} indirme</span>
                {module.premium ? (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-2 py-1 rounded-full text-xs">
                    Premium
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-blue-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs">
                    Ücretsiz
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Ana Modül Manager Bileşeni */}
      <ModuleManager />
    </div>
  )
} 