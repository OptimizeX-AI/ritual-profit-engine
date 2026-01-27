import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";
import { TimesheetModal } from "@/components/tasks/TimesheetModal";
import { useTasks, Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Clock, 
  Plus, 
  Flame,
  Target,
  TrendingUp,
  Loader2,
  Calendar,
  User,
  Folder,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfDay, subDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

// Período de filtro
type PeriodFilter = "today" | "week" | "month";

export default function Timesheet() {
  const { user } = useAuth();
  const { profile, isAdmin } = useOrganization();
  const { tasks, isLoading: loadingTasks } = useTasks();
  const { projects, isLoading: loadingProjects } = useProjects();
  const { members, isLoading: loadingMembers } = useTeamMembers();

  const [period, setPeriod] = useState<PeriodFilter>("week");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterMember, setFilterMember] = useState<string>("mine");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isLoading = loadingTasks || loadingProjects || loadingMembers;

  // ==========================
  // FILTERING LOGIC
  // ==========================
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const periodStart = period === "today" 
      ? startOfDay(now)
      : period === "week"
        ? subDays(now, 7)
        : subDays(now, 30);

    return tasks.filter((task) => {
      // Period filter (based on updated_at for time logs)
      const taskDate = new Date(task.updated_at);
      const inPeriod = isWithinInterval(taskDate, { start: periodStart, end: now });
      
      // Only tasks with time spent
      if (task.time_spent_minutes === 0) return false;
      
      // Project filter
      if (filterProject !== "all" && task.project_id !== filterProject) return false;
      
      // Member filter
      if (filterMember === "mine" && task.assignee_id !== user?.id) return false;
      if (filterMember !== "all" && filterMember !== "mine" && task.assignee_id !== filterMember) return false;

      return inPeriod;
    });
  }, [tasks, period, filterProject, filterMember, user?.id]);

  // ==========================
  // KPI CALCULATIONS
  // ==========================
  const kpis = useMemo(() => {
    // Today's hours
    const today = startOfDay(new Date());
    const todayTasks = tasks.filter((t) => {
      const taskDate = new Date(t.updated_at);
      return isWithinInterval(taskDate, { start: today, end: new Date() }) &&
        (filterMember === "mine" ? t.assignee_id === user?.id : true);
    });
    const todayMinutes = todayTasks.reduce((sum, t) => sum + t.time_spent_minutes, 0);

    // Week hours
    const weekStart = subDays(new Date(), 7);
    const weekTasks = tasks.filter((t) => {
      const taskDate = new Date(t.updated_at);
      return isWithinInterval(taskDate, { start: weekStart, end: new Date() }) &&
        (filterMember === "mine" ? t.assignee_id === user?.id : true);
    });
    const weekMinutes = weekTasks.reduce((sum, t) => sum + t.time_spent_minutes, 0);

    // Month hours
    const monthStart = subDays(new Date(), 30);
    const monthTasks = tasks.filter((t) => {
      const taskDate = new Date(t.updated_at);
      return isWithinInterval(taskDate, { start: monthStart, end: new Date() }) &&
        (filterMember === "mine" ? t.assignee_id === user?.id : true);
    });
    const monthMinutes = monthTasks.reduce((sum, t) => sum + t.time_spent_minutes, 0);

    // Utilization Rate (Client vs Internal)
    // For now, we consider tasks with project_id as "Client" and without as "Internal"
    const clientMinutes = filteredTasks
      .filter((t) => t.project_id)
      .reduce((sum, t) => sum + t.time_spent_minutes, 0);
    const internalMinutes = filteredTasks
      .filter((t) => !t.project_id)
      .reduce((sum, t) => sum + t.time_spent_minutes, 0);
    const totalMinutes = clientMinutes + internalMinutes;
    const utilizationRate = totalMinutes > 0 ? (clientMinutes / totalMinutes) * 100 : 0;

    return {
      todayMinutes,
      todayHours: todayMinutes / 60,
      weekMinutes,
      weekHours: weekMinutes / 60,
      monthMinutes,
      monthHours: monthMinutes / 60,
      clientMinutes,
      internalMinutes,
      utilizationRate,
    };
  }, [tasks, filteredTasks, filterMember, user?.id]);

  // ==========================
  // STREAK CALCULATION (Gamification)
  // ==========================
  const streak = useMemo(() => {
    if (!user?.id) return 0;
    
    const myTasks = tasks.filter((t) => t.assignee_id === user.id && t.time_spent_minutes > 0);
    if (myTasks.length === 0) return 0;

    // Group by day and check if >7h per day
    const dailyHours = new Map<string, number>();
    myTasks.forEach((task) => {
      const day = format(new Date(task.updated_at), "yyyy-MM-dd");
      dailyHours.set(day, (dailyHours.get(day) || 0) + task.time_spent_minutes);
    });

    // Count consecutive days with >7h (420 minutes)
    let streakCount = 0;
    let currentDate = startOfDay(new Date());
    
    for (let i = 0; i < 30; i++) {
      const dayKey = format(currentDate, "yyyy-MM-dd");
      const dayMinutes = dailyHours.get(dayKey) || 0;
      
      if (dayMinutes >= 420) { // 7 hours
        streakCount++;
        currentDate = subDays(currentDate, 1);
      } else if (i === 0) {
        // Today doesn't count yet if not completed
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streakCount;
  }, [tasks, user?.id]);

  // ==========================
  // PIE CHART DATA
  // ==========================
  const pieData = [
    { name: "Clientes", value: kpis.clientMinutes / 60, color: "hsl(var(--primary))" },
    { name: "Interno", value: kpis.internalMinutes / 60, color: "hsl(var(--muted-foreground))" },
  ].filter((d) => d.value > 0);

  // Format time helper
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  };

  const handleOpenTimesheet = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

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
        {/* Header with Gamification */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Timesheet</h1>
              {streak > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1 text-orange-600 bg-orange-100 dark:bg-orange-950">
                      <Flame className="h-3.5 w-3.5" />
                      {streak} dias
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Streak: {streak} dias consecutivos com 7h+ registradas</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-muted-foreground">
              Diagnóstico de produtividade — {profile?.name || "Usuário"}
            </p>
          </div>
          <Button className="gap-2" onClick={() => {
            const unloggedTask = tasks.find((t) => 
              t.assignee_id === user?.id && 
              t.status !== "done" && 
              t.time_spent_minutes === 0
            );
            if (unloggedTask) {
              handleOpenTimesheet(unloggedTask);
            } else if (tasks.length > 0) {
              handleOpenTimesheet(tasks[0]);
            }
          }}>
            <Plus className="h-4 w-4" />
            Registrar Tempo
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Balance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Saldo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {formatTime(kpis.todayMinutes)}
                  </span>
                  <span className="text-muted-foreground">/ 8h</span>
                </div>
                <Progress 
                  value={Math.min((kpis.todayHours / 8) * 100, 100)} 
                  className={cn(
                    "h-2",
                    kpis.todayHours >= 8 
                      ? "[&>div]:bg-green-500" 
                      : "[&>div]:bg-amber-500"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {kpis.todayHours >= 8 
                    ? "✓ Meta diária atingida" 
                    : `Faltam ${formatTime((8 * 60) - kpis.todayMinutes)}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Week Hours */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Horas na Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {formatTime(kpis.weekMinutes)}
                </span>
                <span className="text-muted-foreground">/ 40h</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((kpis.weekHours / 40) * 100).toFixed(0)}% da meta semanal
              </p>
            </CardContent>
          </Card>

          {/* Month Hours */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Horas no Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {formatTime(kpis.monthMinutes)}
                </span>
                <span className="text-muted-foreground">/ 160h</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((kpis.monthHours / 160) * 100).toFixed(0)}% da meta mensal
              </p>
            </CardContent>
          </Card>

          {/* Utilization Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Taxa de Utilização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      kpis.utilizationRate >= 60 ? "text-green-600" : "text-amber-600"
                    )}>
                      {kpis.utilizationRate.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Meta: 60% em clientes
                  </p>
                </div>
                {pieData.length > 0 && (
                  <div className="h-16 w-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          innerRadius={15}
                          outerRadius={30}
                          paddingAngle={2}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Lançamentos de Tempo</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-40">
                    <Folder className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Projetos</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isAdmin && (
                  <Select value={filterMember} onValueChange={setFilterMember}>
                    <SelectTrigger className="w-40">
                      <User className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Membro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mine">Meus Lançamentos</SelectItem>
                      <SelectItem value="all">Toda Equipe</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Nenhum lançamento de tempo neste período.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Projeto</TableHead>
                    {isAdmin && <TableHead>Responsável</TableHead>}
                    <TableHead className="text-right">Tempo</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help flex items-center justify-end gap-1">
                              Custo Est.
                              <AlertCircle className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tempo × Custo Hora do colaborador</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                    )}
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const assignee = members.find((m) => m.id === task.assignee_id);
                    const hourlyRate = assignee?.custo_hora_centavos || 0;
                    const estimatedCost = (task.time_spent_minutes / 60) * hourlyRate;

                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(task.updated_at), "dd MMM, HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.project ? (
                            <Badge variant="secondary">{task.project.name}</Badge>
                          ) : (
                            <Badge variant="outline">Interno</Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-muted-foreground">
                            {task.assignee?.name || "-"}
                          </TableCell>
                        )}
                        <TableCell className="text-right font-medium">
                          {formatTime(task.time_spent_minutes)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right text-muted-foreground">
                            {hourlyRate > 0 
                              ? `R$ ${(estimatedCost / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : "-"
                            }
                          </TableCell>
                        )}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenTimesheet(task)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Timesheet Modal */}
        <TimesheetModal
          task={selectedTask}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
    </MainLayout>
  );
}
