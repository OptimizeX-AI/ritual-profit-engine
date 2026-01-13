import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ClientProfitability } from "@/components/dashboard/ClientProfitability";
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { DREMini } from "@/components/dashboard/DREMini";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle,
  Target
} from "lucide-react";

const Index = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Janeiro 2026 • Método Lázaro do Carmo
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard
            title="Receita Líquida"
            value="R$ 115.000"
            subtitle="Meta: R$ 120.000"
            change={8.5}
            changeLabel="vs mês anterior"
            icon={DollarSign}
            variant="neutral"
          />
          <KPICard
            title="Lucro Líquido"
            value="R$ 34.250"
            subtitle="Margem: 29,8%"
            change={12.3}
            changeLabel="vs mês anterior"
            icon={TrendingUp}
            variant="profit"
          />
          <KPICard
            title="Clientes Ativos"
            value="12"
            subtitle="2 em risco de churn"
            change={-8}
            changeLabel="vs mês anterior"
            icon={Users}
            variant="warning"
          />
          <KPICard
            title="Horas Vendidas"
            value="480h"
            subtitle="Realizadas: 520h"
            icon={Clock}
            variant="loss"
          />
          <KPICard
            title="Tarefas Atrasadas"
            value="7"
            subtitle="de 84 ativas"
            icon={AlertTriangle}
            variant="loss"
          />
          <KPICard
            title="Pipeline CRM"
            value="R$ 45.000"
            subtitle="3 propostas abertas"
            change={25}
            changeLabel="vs mês anterior"
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
