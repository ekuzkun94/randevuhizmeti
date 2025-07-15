import { IntegrationMarketplace } from '@/components/marketplace/IntegrationMarketplace'

export default function MarketplacePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Entegrasyon Pazaryeri</h1>
        <p className="text-muted-foreground">
          Sisteminizi genişletmek için entegrasyonları keşfedin ve yönetin
        </p>
      </div>
      
      <IntegrationMarketplace />
    </div>
  )
} 