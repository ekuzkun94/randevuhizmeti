'use client'

import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { Card } from '@/components/ui/Card'
import { 
  Store, 
  Package, 
  Download, 
  Star, 
  TrendingUp,
  Zap,
  Globe,
  Shield,
  Mail
} from 'lucide-react'
import { IntegrationMarketplace } from '@/components/marketplace/IntegrationMarketplace'

export default function MarketplacePage() {
  // Mock stats - gerçek uygulamada API'den gelecek
  const stats = {
    totalIntegrations: 24,
    installedIntegrations: 8,
    activeIntegrations: 6,
    premiumIntegrations: 12,
    totalDownloads: 156,
    averageRating: 4.2
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
        title="Entegrasyon Pazaryeri"
        description="Sisteminizi genişletmek için entegrasyonları keşfedin ve yönetin"
        icon={<Store className="w-6 h-6" />}
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
          title="Toplam Entegrasyon"
          value={stats.totalIntegrations}
          icon={<Package className="w-5 h-5" />}
          gradient="from-blue-500 to-cyan-600"
          description="Mevcut entegrasyonlar"
        />
        <StatsCard
          title="Kurulu Entegrasyon"
          value={stats.installedIntegrations}
          icon={<Download className="w-5 h-5" />}
          gradient="from-green-500 to-emerald-600"
          description="Sisteminizde kurulu"
        />
        <StatsCard
          title="Aktif Entegrasyon"
          value={stats.activeIntegrations}
          icon={<Zap className="w-5 h-5" />}
          gradient="from-orange-500 to-red-600"
          description="Şu anda aktif"
        />
        <StatsCard
          title="Premium Entegrasyon"
          value={stats.premiumIntegrations}
          icon={<Star className="w-5 h-5" />}
          gradient="from-purple-500 to-pink-600"
          description="Premium özellikler"
        />
      </motion.div>

      {/* Öne Çıkan Entegrasyonlar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Öne Çıkan Entegrasyonlar</h3>
            <p className="text-sm text-muted-foreground">En popüler ve yeni entegrasyonlar</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <TrendingUp size={16} />
            <span>Trending</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Stripe Payment', category: 'PAYMENT', icon: <Globe className="w-8 h-8 text-green-500" />, rating: 4.8, downloads: 1240 },
            { name: 'SendGrid Email', category: 'COMMUNICATION', icon: <Mail className="w-8 h-8 text-blue-500" />, rating: 4.6, downloads: 890 },
            { name: 'Auth0 Security', category: 'SECURITY', icon: <Shield className="w-8 h-8 text-red-500" />, rating: 4.9, downloads: 1560 }
          ].map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-border rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {integration.icon}
                  <div>
                    <h4 className="font-medium">{integration.name}</h4>
                    <p className="text-sm text-muted-foreground">{integration.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{integration.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{integration.downloads} indirme</span>
                <span className="bg-gradient-to-r from-blue-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs">
                  Popüler
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Ana Entegrasyon Bileşeni */}
      <IntegrationMarketplace />
    </div>
  )
} 