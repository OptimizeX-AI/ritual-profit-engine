import { MainLayout } from "@/components/layout/MainLayout";
import { CRMKanbanBoard } from "@/components/crm/CRMKanbanBoard";

export default function CRM() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM - Pipeline de Vendas</h1>
          <p className="text-muted-foreground">
            Arraste os negócios entre as colunas para atualizar o status
          </p>
        </div>

        {/* Kanban Board */}
        <CRMKanbanBoard />
      </div>
    </MainLayout>
  );
}
