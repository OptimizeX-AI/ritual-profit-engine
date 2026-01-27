import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { TimesheetModal } from "@/components/tasks/TimesheetModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Timer, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MyActiveTasks() {
  const { user } = useAuth();
  const { tasks, isLoading } = useTasks();
  const { projects } = useProjects();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timesheetOpen, setTimesheetOpen] = useState(false);

  // Filter tasks for current user that are not done
  const myTasks = tasks
    .filter((t) => t.assignee_id === user?.id && t.status !== "done")
    .sort((a, b) => {
      // Sort by deadline (nulls last)
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  const handleOpenTimesheet = (task: Task) => {
    setSelectedTask(task);
    setTimesheetOpen(true);
  };

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return { label: "Sem prazo", variant: "secondary" as const, isLate: false };
    
    const deadlineDate = new Date(deadline);
    
    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
      const daysLate = differenceInDays(new Date(), deadlineDate);
      return { 
        label: `${daysLate}d atrasada`, 
        variant: "destructive" as const,
        isLate: true 
      };
    }
    
    if (isToday(deadlineDate)) {
      return { label: "Hoje", variant: "default" as const, isLate: false };
    }

    const daysUntil = differenceInDays(deadlineDate, new Date());
    if (daysUntil <= 2) {
      return { label: `${daysUntil}d`, variant: "warning" as const, isLate: false };
    }

    return { 
      label: format(deadlineDate, "dd/MM", { locale: ptBR }), 
      variant: "secondary" as const,
      isLate: false 
    };
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? `${m}m` : ""}` : `${m}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Minhas Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                Minhas Tarefas
              </CardTitle>
              <CardDescription>
                {myTasks.length === 0 
                  ? "Você não tem tarefas pendentes" 
                  : `${myTasks.length} tarefa${myTasks.length > 1 ? "s" : ""} ativa${myTasks.length > 1 ? "s" : ""}`
                }
              </CardDescription>
            </div>
            {myTasks.some((t) => t.deadline && isPast(new Date(t.deadline)) && !isToday(new Date(t.deadline))) && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Atrasadas
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-profit/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Tudo em dia! Nenhuma tarefa pendente.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTasks.slice(0, 5).map((task) => {
                  const project = projects.find((p) => p.id === task.project_id);
                  const deadlineStatus = getDeadlineStatus(task.deadline);

                  return (
                    <TableRow 
                      key={task.id}
                      className={cn(deadlineStatus.isLate && "bg-destructive/5")}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(task.time_spent_minutes)} / {formatTime(task.estimated_time_minutes)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {project?.name || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={deadlineStatus.variant as any}
                          className={cn(
                            "text-xs",
                            deadlineStatus.variant === "warning" && "bg-warning text-warning-foreground"
                          )}
                        >
                          {deadlineStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => handleOpenTimesheet(task)}
                        >
                          <Timer className="h-3.5 w-3.5" />
                          Registrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {myTasks.length > 5 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              + {myTasks.length - 5} tarefas não exibidas
            </p>
          )}
        </CardContent>
      </Card>

      <TimesheetModal
        task={selectedTask}
        open={timesheetOpen}
        onOpenChange={setTimesheetOpen}
      />
    </>
  );
}
