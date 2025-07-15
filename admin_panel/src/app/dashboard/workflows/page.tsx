"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ListChecks } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  isActive: boolean;
  createdAt: string;
  steps: Array<{
    id: string;
    name: string;
    order: number;
    description?: string;
  }>;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    entityType: "",
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || []);
      }
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkflow),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewWorkflow({ name: "", description: "", entityType: "" });
        fetchWorkflows();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListChecks className="w-7 h-7 text-primary" /> İş Akışları
          </h1>
          <p className="text-muted-foreground">Onay süreçlerini ve adımlarını yönetin</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Yeni İş Akışı
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni İş Akışı Oluştur</DialogTitle>
              <DialogDescription>Onay süreci için yeni bir iş akışı tanımlayın</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="İş akışı adı"
                value={newWorkflow.name}
                onChange={e => setNewWorkflow(w => ({ ...w, name: e.target.value }))}
              />
              <Input
                placeholder="Varlık tipi (örn: user, invoice)"
                value={newWorkflow.entityType}
                onChange={e => setNewWorkflow(w => ({ ...w, entityType: e.target.value }))}
              />
              <Input
                placeholder="Açıklama (isteğe bağlı)"
                value={newWorkflow.description}
                onChange={e => setNewWorkflow(w => ({ ...w, description: e.target.value }))}
              />
              <Button onClick={createWorkflow}>Oluştur</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        {loading ? (
          <div className="flex items-center justify-center h-32">Yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map(wf => (
              <Card key={wf.id}>
                <CardHeader>
                  <CardTitle>{wf.name}</CardTitle>
                  <CardDescription>{wf.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-2">Varlık tipi: {wf.entityType}</div>
                  <div className="text-xs mb-2">Adım sayısı: {wf.steps?.length ?? 0}</div>
                  <div className="flex flex-col gap-1">
                    {wf.steps?.map(step => (
                      <div key={step.id} className="text-sm pl-2 border-l-2 border-primary/30">{step.order}. {step.name}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 