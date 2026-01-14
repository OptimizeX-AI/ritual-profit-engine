import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle2, Pause, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, TaskStatus } from "@/hooks/useTasks";

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; className: string }> = {
  todo: { label: "A Fazer", icon: Clock, className: "status-pending" },
  in_progress: { label: "Em Andamento", icon: Play, className: "status-pending" },
  waiting_approval: { label: "Aguard. Cliente", icon: Pause, className: "status-waiting" },
  done: { label: "Concluída", icon: CheckCircle2, className: "status-on-time" },
  late: { label: "Atrasada", icon: AlertTriangle, className: "status-late" },
};

export function TasksOverview() {
  const { tasks, isLoading } = useTasks();

  // Calculate effective status considering SLA rules
  const getEffectiveStatus = (task: typeof tasks[0]): TaskStatus => {
    if (task.status === "waiting_approval" || task.status === "done") {
      return task.status;
    }
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);
      if (deadline < today) return "late";
    }
    return task.status;
  };

  // Get critical tasks (not done, sorted by deadline)
  const criticalTasks = tasks
    .filter((t) => t.status !== "done")
    .map((t) => ({ ...t, effectiveStatus: getEffectiveStatus(t) }))
    .sort((a, b) => {
      // Late tasks first
      if (a.effectiveStatus === "late" && b.effectiveStatus !== "late") return -1;
      if (b.effectiveStatus === "late" && a.effectiveStatus !== "late") return 1;
      // Then by deadline
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    })
    .slice(0, 5);

  const lateCount = tasks.filter((t) => getEffectiveStatus(t) === "late").length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`;
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Tarefas Críticas</CardTitle>
          <Badge variant="secondary" className={cn("font-medium", lateCount > 0 && "bg-loss/10 text-loss")}>
            {lateCount} atrasadas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {criticalTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa pendente</p>
        ) : (
          <div className="space-y-3">
            {criticalTasks.map((task) => {
              const config = statusConfig[task.effectiveStatus];
              const StatusIcon = config.icon;
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    task.effectiveStatus === "late" && "table-row-late border-loss/20",
                    task.effectiveStatus === "waiting_approval" && "table-row-warning border-warning/20"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.project?.name || "Sem projeto"} • {task.assignee?.name || "Sem responsável"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDate(task.deadline)}</span>
                    <div className={config.className}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{config.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
