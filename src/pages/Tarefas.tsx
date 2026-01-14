import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, TaskStatus, CreateTaskInput } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";

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
  const { tasks, lateCount, waitingCount, isLoading, createTask, deleteTask, isCreating } =
    useTasks();
  const { projects } = useProjects();
  const { members } = useTeamMembers();

  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d atrasado`;
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const handleCreateTask = () => {
    if (!newTask.title) return;
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
    setDialogOpen(false);
  };

  const filteredTasks = tasks
    .filter((t) => filter === "all" || t.status === filter)
    .filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
                <DialogDescription>Adicione uma nova tarefa ao sistema.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Ex: Criar campanhas Google Ads"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Detalhes da tarefa..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto</Label>
                    <Select
                      value={newTask.project_id}
                      onValueChange={(v) => setNewTask({ ...newTask, project_id: v })}
                    >
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignee">Responsável</Label>
                    <Select
                      value={newTask.assignee_id}
                      onValueChange={(v) => setNewTask({ ...newTask, assignee_id: v })}
                    >
                      <SelectTrigger>
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
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    />
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
                <Button onClick={handleCreateTask} disabled={isCreating || !newTask.title}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Tarefa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              {lateCount} atrasadas
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Pause className="h-3 w-3 text-warning" />
              {waitingCount} aguardando
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
                  const config = statusConfig[task.status];
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
                        task.status === "late" && "table-row-late",
                        task.status === "waiting_approval" && "table-row-warning"
                      )}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                            {task.description || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.project ? (
                          <Badge variant="secondary" className="font-normal">
                            {task.project.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{task.assignee?.name || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm",
                            task.status === "late" && "text-loss font-medium"
                          )}
                        >
                          {formatDate(task.deadline)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={cn("status-badge", config.className)}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </div>
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
    </MainLayout>
  );
}
