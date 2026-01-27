import { MainLayout } from "@/components/layout/MainLayout";
import { GoalsGauges } from "@/components/warroom/GoalsGauges";
import { SalesRanking } from "@/components/warroom/SalesRanking";
import { ChurnRadar } from "@/components/warroom/ChurnRadar";
import { GoalsManager } from "@/components/warroom/GoalsManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useOrganization } from "@/contexts/OrganizationContext";
import { DollarSign, AlertTriangle, Clock, Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function WarRoom() {
  const { isAdmin } = useOrganization();
  const { transactions, isLoading: loadingTransactions } = useTransactions();
  const { projects, isLoading: loadingProjects } = useProjects();
  const { tasks, isLoading: loadingTasks } = useTasks();

  const isLoading = loadingTransactions || loadingProjects || loadingTasks;

  // ============================================
  // BLOCO 1: Receita do Mês
  // ============================================
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = transactions
    .filter((t) => {
      if (t.type !== "receita" || t.is_repasse) return false;
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.value_centavos, 0);

  // ============================================
  // BLOCO 2: Projetos em Risco
  // ============================================
  const projectsAtRisk = projects
    .filter((p) => {
      if (!p.horas_contratadas || p.horas_contratadas === 0) return false;
      
      const hoursSpent = tasks
        .filter((t) => t.project_id === p.id)
        .reduce((sum, t) => sum + t.time_spent_minutes / 60, 0);
      
      return hoursSpent > p.horas_contratadas * 0.8;
    })
    .map((p) => {
      const hoursSpent = tasks
        .filter((t) => t.project_id === p.id)
        .reduce((sum, t) => sum + t.time_spent_minutes / 60, 0);
      
      return {
        id: p.id,
        name: p.name,
        hoursContracted: p.horas_contratadas || 0,
        hoursSpent: Math.round(hoursSpent * 10) / 10,
        percentage: Math.round((hoursSpent / (p.horas_contratadas || 1)) * 100),
      };
    });

  // ============================================
  // BLOCO 3: Gargalos
  // ============================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bottlenecks = tasks.filter((t) => {
    if (t.deadline) {
      const deadline = new Date(t.deadline);
      deadline.setHours(0, 0, 0, 0);
      if (deadline < today && t.status !== "done") return true;
    }
    if (t.status === "waiting_approval") return true;
    return false;
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-6 w-6" />
              War Room
            </h1>
            <p className="text-muted-foreground">
              Visão executiva — Metas vs Realizado
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Bloco A: Metas (Gauges) */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            O Alvo
          </h2>
          <GoalsGauges />
        </section>

        {/* Grid Principal */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bloco B: Ranking de Vendas */}
          <SalesRanking />

          {/* Bloco C: Radar de Churn */}
          <ChurnRadar />
        </div>

        {/* Cards Operacionais (Legado melhorado) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Receita do Mês */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-profit" />
                Receita do Mês
              </CardTitle>
              <CardDescription>
                Transações operacionais (excl. repasses)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-profit">
                {formatCurrency(monthlyRevenue)}
              </div>
            </CardContent>
          </Card>

          {/* Projetos em Risco */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  projectsAtRisk.length > 0 ? "text-destructive" : "text-muted-foreground"
                )} />
                Projetos em Risco
              </CardTitle>
              <CardDescription>
                Acima de 80% das horas contratadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectsAtRisk.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum projeto em risco no momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {projectsAtRisk.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              p.percentage >= 100 ? "bg-destructive" : "bg-warning"
                            )}
                            style={{ width: `${Math.min(p.percentage, 100)}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-medium min-w-[40px] text-right",
                          p.percentage >= 100 ? "text-destructive" : "text-warning"
                        )}>
                          {p.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gargalos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className={cn(
                  "h-5 w-5",
                  bottlenecks.length > 0 ? "text-warning" : "text-muted-foreground"
                )} />
                Gargalos
              </CardTitle>
              <CardDescription>
                Tarefas atrasadas ou aguardando aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bottlenecks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum gargalo identificado.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-warning">
                    {bottlenecks.length}
                  </div>
                  <div className="space-y-1">
                    {bottlenecks.slice(0, 4).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-sm">
                        <span className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          task.status === "waiting_approval" ? "bg-pending" : "bg-destructive"
                        )} />
                        <span className="truncate text-muted-foreground">
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin: Gerenciar Metas */}
        {isAdmin && (
          <section className="pt-4">
            <GoalsManager />
          </section>
        )}
      </div>
    </MainLayout>
  );
}
