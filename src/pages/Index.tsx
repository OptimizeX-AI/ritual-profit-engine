import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ClientProfitability } from "@/components/dashboard/ClientProfitability";
import { ClientProfitabilityTable } from "@/components/dashboard/ClientProfitabilityTable";
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { DREMini } from "@/components/dashboard/DREMini";
import { MyActiveTasks } from "@/components/tasks/MyActiveTasks";
import { DollarSign, TrendingUp, Users, Clock, AlertTriangle, Target } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCRMKanban } from "@/hooks/useCRMKanban";
import { useTasks } from "@/hooks/useTasks";

const Index = () => {
  const { clients, isLoading } = useClients();
  const { organization } = useOrganization();
  const { pipelineValue, isLoading: loadingCRM } = useCRMKanban();
  const { tasks, lateCount, isLoading: loadingTasks } = useTasks();

  // Calculate stats from real data
  const activeClients = clients.filter(
    (c) => !c.contrato_fim || new Date(c.contrato_fim) >= new Date()
  ).length;

  const totalRevenue = clients.reduce((acc, c) => acc + (c.fee_mensal_centavos || 0), 0);

  // Total hours sold (from tasks estimated time)
  const totalHoursSold = tasks.reduce((acc, t) => acc + t.estimated_time_minutes, 0) / 60;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            {organization?.name || "Sua Agência"} - Janeiro 2026
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard
            title="Receita Mensal"
            value={isLoading ? "..." : `R$ ${(totalRevenue / 100).toLocaleString("pt-BR")}`}
            subtitle="Fee dos clientes"
            icon={DollarSign}
            variant="neutral"
          />
          <KPICard
            title="Lucro Líquido"
            value="--"
            subtitle="Fase 2: Financeiro"
            icon={TrendingUp}
            variant="neutral"
          />
          <KPICard
            title="Clientes Ativos"
            value={isLoading ? "..." : String(activeClients)}
            subtitle={`de ${clients.length} cadastrados`}
            icon={Users}
            variant={activeClients > 0 ? "profit" : "neutral"}
          />
          <KPICard
            title="Horas Vendidas"
            value={loadingTasks ? "..." : `${Math.round(totalHoursSold)}h`}
            subtitle="Total estimado"
            icon={Clock}
            variant="neutral"
          />
          <KPICard
            title="Tarefas Atrasadas"
            value={loadingTasks ? "..." : String(lateCount)}
            subtitle={lateCount > 0 ? "Ação necessária" : "Tudo em dia"}
            icon={AlertTriangle}
            variant={lateCount > 0 ? "loss" : "profit"}
          />
          <KPICard
            title="Pipeline CRM"
            value={loadingCRM ? "..." : `R$ ${(pipelineValue / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
            subtitle="Ponderado"
            icon={Target}
            variant="profit"
          />
        </div>

        {/* My Active Tasks - Destaque */}
        <MyActiveTasks />

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <RevenueChart />
          <ClientProfitability />
        </div>

        {/* Client Profitability Table */}
        <ClientProfitabilityTable />

        {/* Tasks and DRE Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <TasksOverview />
          <DREMini />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
