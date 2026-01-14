import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ClientProfitability } from "@/components/dashboard/ClientProfitability";
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { DREMini } from "@/components/dashboard/DREMini";
import { DollarSign, TrendingUp, Users, Clock, AlertTriangle, Target } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useOrganization } from "@/contexts/OrganizationContext";

const Index = () => {
  const { clients, isLoading } = useClients();
  const { organization } = useOrganization();

  // Calculate stats from real data
  const activeClients = clients.filter(
    (c) => !c.contrato_fim || new Date(c.contrato_fim) >= new Date()
  ).length;

  const totalRevenue = clients.reduce((acc, c) => acc + (c.fee_mensal_centavos || 0), 0);

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
            value="--"
            subtitle="Fase 2: Timesheet"
            icon={Clock}
            variant="neutral"
          />
          <KPICard
            title="Tarefas Atrasadas"
            value="--"
            subtitle="Fase 2: Bíblia"
            icon={AlertTriangle}
            variant="neutral"
          />
          <KPICard
            title="Pipeline CRM"
            value="--"
            subtitle="Fase 2: CRM"
            icon={Target}
            variant="neutral"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <RevenueChart />
          <ClientProfitability />
        </div>

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
