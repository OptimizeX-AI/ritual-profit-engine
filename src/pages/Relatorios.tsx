import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { useClientProfitability } from "@/hooks/useClientProfitability";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useOrganization } from "@/contexts/OrganizationContext";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  DollarSign,
  Users,
  Clock,
  Loader2,
  ArrowDown,
  ArrowUp,
  Minus,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Relatorios() {
  const [tab, setTab] = useState("dre");
  
  const { 
    transactions,
    totalReceitas, 
    totalDespesas,
    totalRepasses,
    custosDiretos,
    custosFixos,
    isLoading: loadingTransactions 
  } = useTransactions();
  
  const { data: profitability, isLoading: loadingProfitability } = useClientProfitability();
  const { members, isLoading: loadingMembers } = useTeamMembers();
  const { tasks, isLoading: loadingTasks } = useTasks();
  const { projects, isLoading: loadingProjects } = useProjects();
  const { isAdmin } = useOrganization();

  const isLoading = loadingTransactions || loadingProfitability || loadingMembers || loadingTasks || loadingProjects;

  const formatCurrency = (centavos: number): string => {
    return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ==========================
  // DRE CALCULATIONS
  // ==========================
  const dreData = useMemo(() => {
    // (+) Faturamento Bruto (todas as receitas incluindo repasses)
    const faturamentoBruto = transactions
      .filter(t => t.type === "receita")
      .reduce((sum, t) => sum + t.value_centavos, 0);

    // (-) Repasses de Mídia
    const repasses = totalRepasses;

    // (=) Receita Líquida
    const receitaLiquida = faturamentoBruto - repasses;

    // (-) Custos Variáveis (Impostos, Comissões - TODO: implementar categorias específicas)
    // Por enquanto, estimamos 15% sobre receita líquida
    const custosVariaveis = Math.round(receitaLiquida * 0.15);

    // (=) Margem de Contribuição
    const margemContribuicao = receitaLiquida - custosVariaveis;

    // (-) Custos Fixos (despesas operacionais não vinculadas a projetos)
    const despesasFixas = custosFixos;

    // (=) EBITDA / Lucro Operacional
    const ebitda = margemContribuicao - despesasFixas;

    // Margem EBITDA
    const margemEbitda = receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0;

    return {
      faturamentoBruto,
      repasses,
      receitaLiquida,
      custosVariaveis,
      margemContribuicao,
      despesasFixas,
      ebitda,
      margemEbitda,
    };
  }, [transactions, totalRepasses, custosFixos]);

  // ==========================
  // PROFITABILITY SORTED BY MARGIN
  // ==========================
  const sortedProfitability = useMemo(() => {
    if (!profitability) return [];
    // Sort by margin ascending (lowest margin first - to expose problems)
    return [...profitability].sort((a, b) => a.margin - b.margin);
  }, [profitability]);

  // ==========================
  // TEAM HOURS DATA
  // ==========================
  const teamHoursData = useMemo(() => {
    const hoursMap = new Map<string, { name: string; hours: number; tasks: number }>();

    members.forEach((member) => {
      hoursMap.set(member.id, { name: member.name, hours: 0, tasks: 0 });
    });

    tasks.forEach((task) => {
      if (task.assignee_id && hoursMap.has(task.assignee_id)) {
        const current = hoursMap.get(task.assignee_id)!;
        current.hours += task.time_spent_minutes / 60;
        current.tasks += 1;
        hoursMap.set(task.assignee_id, current);
      }
    });

    return Array.from(hoursMap.values())
      .filter((m) => m.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [members, tasks]);

  // ==========================
  // OVER-SERVICING PROJECTS
  // ==========================
  const overServicingProjects = useMemo(() => {
    return projects
      .map((project) => {
        const projectTasks = tasks.filter((t) => t.project_id === project.id);
        const horasRealizadas = projectTasks.reduce((sum, t) => sum + t.time_spent_minutes, 0) / 60;
        const horasContratadas = project.horas_contratadas || 0;
        const percentual = horasContratadas > 0 ? (horasRealizadas / horasContratadas) * 100 : 0;

        return {
          id: project.id,
          name: project.name,
          horasRealizadas,
          horasContratadas,
          percentual,
          excedente: horasRealizadas - horasContratadas,
        };
      })
      .filter((p) => p.horasContratadas > 0 && p.percentual > 100)
      .sort((a, b) => b.percentual - a.percentual);
  }, [projects, tasks]);

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            A Verdade Financeira — Análises gerenciais e performance operacional
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="dre" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              DRE
            </TabsTrigger>
            <TabsTrigger value="rentabilidade" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Rentabilidade
            </TabsTrigger>
            <TabsTrigger value="operacional" className="gap-2">
              <Activity className="h-4 w-4" />
              Operacional
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB A: DRE ==================== */}
          <TabsContent value="dre" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Demonstrativo de Resultados do Exercício (DRE)</CardTitle>
                <CardDescription>
                  Visão gerencial — estrutura de cascata financeira
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Linha 1: Faturamento Bruto */}
                  <DRELine
                    label="(+) Faturamento Bruto"
                    value={dreData.faturamentoBruto}
                    icon={ArrowUp}
                    variant="income"
                  />

                  {/* Linha 2: Repasses */}
                  <DRELine
                    label="(-) Repasses de Mídia"
                    value={-dreData.repasses}
                    icon={Minus}
                    variant="repasse"
                    note="Dinheiro que não é nosso"
                  />

                  {/* Linha 3: Receita Líquida */}
                  <div className="border-t-2 border-primary pt-4">
                    <DRELine
                      label="(=) RECEITA LÍQUIDA"
                      value={dreData.receitaLiquida}
                      icon={DollarSign}
                      variant="highlight"
                      note="Base de cálculo real"
                    />
                  </div>

                  {/* Linha 4: Custos Variáveis */}
                  <DRELine
                    label="(-) Custos Variáveis (Est. 15%)"
                    value={-dreData.custosVariaveis}
                    icon={ArrowDown}
                    variant="expense"
                    note="Impostos, Comissões"
                  />

                  {/* Linha 5: Margem de Contribuição */}
                  <DRELine
                    label="(=) Margem de Contribuição"
                    value={dreData.margemContribuicao}
                    icon={TrendingUp}
                    variant="neutral"
                  />

                  {/* Linha 6: Custos Fixos */}
                  <DRELine
                    label="(-) Custos Fixos"
                    value={-dreData.despesasFixas}
                    icon={ArrowDown}
                    variant="expense"
                    note="Salários, Aluguel, Infraestrutura"
                  />

                  {/* Linha 7: EBITDA */}
                  <div className="border-t-4 border-primary pt-4 mt-4">
                    <div className={cn(
                      "p-4 rounded-lg",
                      dreData.ebitda >= 0 ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {dreData.ebitda >= 0 ? (
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          ) : (
                            <TrendingDown className="h-6 w-6 text-red-600" />
                          )}
                          <div>
                            <p className="text-lg font-bold">EBITDA / LUCRO OPERACIONAL</p>
                            <p className="text-sm text-muted-foreground">
                              Margem: {dreData.margemEbitda.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <p className={cn(
                          "text-3xl font-bold",
                          dreData.ebitda >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(dreData.ebitda)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB B: RENTABILIDADE ==================== */}
          <TabsContent value="rentabilidade" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rentabilidade por Cliente
                </CardTitle>
                <CardDescription>
                  Ordenado por menor margem — expondo quem dá prejuízo primeiro
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedProfitability.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum cliente cadastrado ainda.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Custo Pessoal</TableHead>
                        <TableHead className="text-right">Custos Diretos</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProfitability.map((client, index) => {
                        const isNegative = client.margin < 0;
                        const isLowMargin = client.margin < 20;
                        
                        return (
                          <TableRow 
                            key={client.clientId}
                            className={cn(
                              index < 3 && isLowMargin && "bg-red-50/50 dark:bg-red-950/30"
                            )}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {index < 3 && isLowMargin && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                {client.clientName}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(client.revenue)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(client.laborCost)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(client.directCosts)}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-semibold",
                              isNegative ? "text-red-600" : "text-green-600"
                            )}>
                              {formatCurrency(client.profit)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "inline-flex items-center gap-1 font-bold",
                                isLowMargin ? "text-red-600" : "text-green-600"
                              )}>
                                {client.margin < 0 ? (
                                  <TrendingDown className="h-4 w-4" />
                                ) : (
                                  <TrendingUp className="h-4 w-4" />
                                )}
                                {client.margin.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              {isNegative ? (
                                <Badge variant="destructive">Prejuízo</Badge>
                              ) : isLowMargin ? (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                  Atenção
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Saudável
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB C: OPERACIONAL ==================== */}
          <TabsContent value="operacional" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Horas por Colaborador */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Horas por Colaborador
                  </CardTitle>
                  <CardDescription>
                    Total de horas registradas no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teamHoursData.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Nenhum apontamento de horas ainda.
                    </p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={teamHoursData}
                          layout="vertical"
                          margin={{ left: 0, right: 24 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" unit="h" />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip
                            formatter={(value: number) => [`${value.toFixed(1)}h`, "Horas"]}
                          />
                          <Bar 
                            dataKey="hours" 
                            radius={[0, 4, 4, 0]}
                          >
                            {teamHoursData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`hsl(var(--primary) / ${0.5 + (index * 0.1)})`}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Over-servicing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Projetos em Over-Servicing
                  </CardTitle>
                  <CardDescription>
                    Horas realizadas acima do vendido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overServicingProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                      <p className="text-muted-foreground">
                        Nenhum projeto em over-servicing 🎉
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {overServicingProjects.map((project) => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{project.name}</span>
                            <Badge variant="destructive" className="text-xs">
                              +{project.excedente.toFixed(1)}h excedente
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={Math.min(project.percentual, 150)} 
                              className="h-2 flex-1"
                            />
                            <span className={cn(
                              "text-sm font-semibold w-16 text-right",
                              project.percentual > 120 ? "text-red-600" : "text-amber-600"
                            )}>
                              {project.percentual.toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {project.horasRealizadas.toFixed(1)}h de {project.horasContratadas}h contratadas
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Metrics Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Total Horas Registradas"
                value={`${tasks.reduce((sum, t) => sum + t.time_spent_minutes, 0) / 60}h`}
                icon={Clock}
              />
              <MetricCard
                title="Tarefas Atrasadas"
                value={tasks.filter(t => t.status === "late").length.toString()}
                icon={AlertTriangle}
                variant={tasks.filter(t => t.status === "late").length > 0 ? "danger" : "success"}
              />
              <MetricCard
                title="Taxa de Utilização"
                value={`${teamHoursData.length > 0 
                  ? ((teamHoursData.reduce((sum, m) => sum + m.hours, 0) / (teamHoursData.length * 160)) * 100).toFixed(0)
                  : 0}%`}
                icon={Activity}
                note="Base: 160h/mês por pessoa"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// ==========================
// HELPER COMPONENTS
// ==========================

interface DRELineProps {
  label: string;
  value: number;
  icon: React.ElementType;
  variant: "income" | "expense" | "repasse" | "highlight" | "neutral";
  note?: string;
}

function DRELine({ label, value, icon: Icon, variant, note }: DRELineProps) {
  const formatCurrency = (centavos: number): string => {
    const absValue = Math.abs(centavos);
    const formatted = `R$ ${(absValue / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return centavos < 0 ? `(${formatted})` : formatted;
  };

  const colorClasses = {
    income: "text-green-600",
    expense: "text-red-600",
    repasse: "text-muted-foreground bg-muted/50 rounded-lg p-2 -mx-2",
    highlight: "text-primary font-bold text-lg",
    neutral: "text-foreground",
  };

  return (
    <div className={cn("flex items-center justify-between py-2", colorClasses[variant])}>
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <div>
          <span className={variant === "highlight" ? "font-bold" : ""}>{label}</span>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
      </div>
      <span className={cn("font-semibold", variant === "highlight" && "text-xl")}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "danger";
  note?: string;
}

function MetricCard({ title, value, icon: Icon, variant = "default", note }: MetricCardProps) {
  const variantClasses = {
    default: "text-foreground",
    success: "text-green-600",
    danger: "text-red-600",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold", variantClasses[variant])}>{value}</p>
            {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
          </div>
          <div className="p-3 rounded-full bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
