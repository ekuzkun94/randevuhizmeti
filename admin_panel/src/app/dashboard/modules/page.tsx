import { ModuleManager } from '@/components/licensing/ModuleManager'

export default function ModulesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Modül Yönetimi</h1>
        <p className="text-muted-foreground">
          Sistem modüllerini ve lisanslarını yönetin
        </p>
      </div>
      
      <ModuleManager />
    </div>
  )
} 