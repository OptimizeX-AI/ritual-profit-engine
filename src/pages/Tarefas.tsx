import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  Loader2,
  Trash2,
  MoreHorizontal,
  Timer,
  Pencil,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, TaskStatus, CreateTaskInput, Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TimesheetModal } from "@/components/tasks/TimesheetModal";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  todo: { label: "A Fazer", icon: Clock, className: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em Andamento", icon: Play, className: "bg-pending/10 text-pending" },
  waiting_approval: {
    label: "Aguard. Cliente",
    icon: Pause,
    className: "bg-warning/10 text-warning",
  },
  done: { label: "Concluído", icon: CheckCircle2, className: "bg-profit/10 text-profit" },
  late: { label: "Atrasado", icon: AlertTriangle, className: "bg-loss/10 text-loss" },
};

export default function Tarefas() {
  const { tasks, lateCount, waitingCount, isLoading, createTask, updateTask, deleteTask, isCreating } =
    useTasks();
  const { projects } = useProjects();
  const { members } = useTeamMembers();

  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timesheetTask, setTimesheetTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newTask, setNewTask] = useState<CreateTaskInput>({
    title: "",
    description: "",
    project_id: "",
    assignee_id: "",
    deadline: "",
    status: "todo",
    estimated_time_minutes: 60,
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
  };

  const formatDate = (dateStr: string | null, status: TaskStatus) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Only show "atrasado" if not done and not waiting approval
    if (diffDays < 0 && status !== "done" && status !== "waiting_approval") {
      return `${Math.abs(diffDays)}d atrasado`;
    }
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const validateNewTask = () => {
    const newErrors: Record<string, string> = {};

    if (!newTask.title.trim()) {
      newErrors.title = "Título é obrigatório";
    }
    if (!newTask.project_id) {
      newErrors.project_id = "Projeto é obrigatório";
    }
    if (!newTask.assignee_id) {
      newErrors.assignee_id = "Responsável é obrigatório";
    }
    if (!newTask.deadline) {
      newErrors.deadline = "Prazo é obrigatório";
    }
    if (!newTask.description?.trim()) {
      newErrors.description = "Descrição é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTask = () => {
    if (!validateNewTask()) return;

    createTask({
      ...newTask,
      project_id: newTask.project_id || undefined,
      assignee_id: newTask.assignee_id || undefined,
      deadline: newTask.deadline || undefined,
    });
    setNewTask({
      title: "",
      description: "",
      project_id: "",
      assignee_id: "",
      deadline: "",
      status: "todo",
      estimated_time_minutes: 60,
    });
    setErrors({});
    setDialogOpen(false);
  };

  // Calculate effective status considering SLA rules
  const getEffectiveStatus = (task: Task): TaskStatus => {
    // If waiting for client approval, SLA is paused - don't mark as late
    if (task.status === "waiting_approval") {
      return "waiting_approval";
    }
    
    // If done, keep as done
    if (task.status === "done") {
      return "done";
    }

    // Check if late (deadline passed and not waiting/done)
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);

      if (deadline < today) {
        return "late";
      }
    }

    return task.status;
  };

  // Process tasks with effective status
  const processedTasks = tasks.map((task) => ({
    ...task,
    effectiveStatus: getEffectiveStatus(task),
  }));

  const filteredTasks = processedTasks
    .filter((t) => filter === "all" || t.effectiveStatus === filter)
    .filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Recalculate counts with effective status
  const effectiveLateCount = processedTasks.filter((t) => t.effectiveStatus === "late").length;
  const effectiveWaitingCount = processedTasks.filter((t) => t.effectiveStatus === "waiting_approval").length;

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask({ id: taskId, status: newStatus });
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">A Bíblia - Gestão de Tarefas</h1>
            <p className="text-muted-foreground">
              "Nenhuma tarefa existe sem Dono, Prazo e Descrição"
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
                <DialogDescription>
                  Todos os campos marcados com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Ex: Criar campanhas Google Ads"
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Descreva detalhadamente o que deve ser feito..."
                    rows={3}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto *</Label>
                    <Select
                      value={newTask.project_id}
                      onValueChange={(v) => setNewTask({ ...newTask, project_id: v })}
                    >
                      <SelectTrigger className={errors.project_id ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.project_id && <p className="text-xs text-destructive">{errors.project_id}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignee">Responsável *</Label>
                    <Select
                      value={newTask.assignee_id}
                      onValueChange={(v) => setNewTask({ ...newTask, assignee_id: v })}
                    >
                      <SelectTrigger className={errors.assignee_id ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.assignee_id && <p className="text-xs text-destructive">{errors.assignee_id}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo *</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      className={errors.deadline ? "border-destructive" : ""}
                    />
                    {errors.deadline && <p className="text-xs text-destructive">{errors.deadline}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated">Tempo Estimado (min)</Label>
                    <Input
                      id="estimated"
                      type="number"
                      value={newTask.estimated_time_minutes}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          estimated_time_minutes: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTask} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Tarefa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* SLA Info Banner */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <Info className="h-4 w-4 text-warning flex-shrink-0" />
          <p className="text-sm text-warning-foreground">
            <strong>Regra de SLA:</strong> Tarefas em "Aguardando Aprovação Cliente" têm o SLA pausado - 
            o atraso não conta contra a equipe enquanto estiver neste status.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefa..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="todo">A Fazer</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="waiting_approval">Aguard. Cliente</SelectItem>
              <SelectItem value="late">Atrasados</SelectItem>
              <SelectItem value="done">Concluídos</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="h-3 w-3 text-loss" />
              {effectiveLateCount} atrasadas
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Pause className="h-3 w-3 text-warning" />
              {effectiveWaitingCount} aguardando
            </Badge>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">Nenhuma tarefa encontrada</p>
              <p className="text-sm text-muted-foreground">
                Clique em "Nova Tarefa" para adicionar.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50">
                  <TableHead className="w-[300px]">Tarefa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const effectiveStatus = task.effectiveStatus;
                  const config = statusConfig[effectiveStatus];
                  const StatusIcon = config.icon;
                  const timePercent =
                    task.estimated_time_minutes > 0
                      ? Math.round(
                          (task.time_spent_minutes / task.estimated_time_minutes) * 100
                        )
                      : 0;

                  return (
                    <TableRow
                      key={task.id}
                      className={cn(
                        effectiveStatus === "late" && "table-row-late",
                        effectiveStatus === "waiting_approval" && "table-row-warning"
                      )}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                            {task.description || <span className="italic text-destructive">Sem descrição</span>}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.project ? (
                          <Badge variant="secondary" className="font-normal">
                            {task.project.name}
                          </Badge>
                        ) : (
                          <span className="text-destructive text-sm italic">Sem projeto</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.assignee?.name || <span className="text-destructive text-sm italic">Sem responsável</span>}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm",
                            effectiveStatus === "late" && "text-loss font-medium"
                          )}
                        >
                          {task.deadline ? formatDate(task.deadline, effectiveStatus) : (
                            <span className="text-destructive italic">Sem prazo</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.status === "late" ? "todo" : task.status}
                          onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                        >
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className="h-3 w-3" />
                              <span>{config.label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">A Fazer</SelectItem>
                            <SelectItem value="in_progress">Em Andamento</SelectItem>
                            <SelectItem value="waiting_approval">Aguard. Cliente</SelectItem>
                            <SelectItem value="done">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                timePercent > 100
                                  ? "bg-loss"
                                  : timePercent > 80
                                  ? "bg-warning"
                                  : "bg-profit"
                              )}
                              style={{ width: `${Math.min(timePercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(task.time_spent_minutes)}/
                            {formatTime(task.estimated_time_minutes)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTimesheetTask(task)}>
                              <Timer className="mr-2 h-4 w-4" />
                              Registrar Tempo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditTask(task)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Timesheet Modal */}
      <TimesheetModal
        task={timesheetTask}
        open={!!timesheetTask}
        onOpenChange={(open) => !open && setTimesheetTask(null)}
      />

      {/* Edit Task Modal */}
      <TaskEditModal
        task={editTask}
        open={!!editTask}
        onOpenChange={(open) => !open && setEditTask(null)}
      />
    </MainLayout>
  );
}
