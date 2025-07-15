import { SchedulerManager } from '@/components/scheduler/SchedulerManager'

export default function SchedulerPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Zamanlayıcı</h1>
        <p className="text-muted-foreground">
          Zamanlanmış görevleri yönetin ve izleyin
        </p>
      </div>
      
      <SchedulerManager />
    </div>
  )
} 