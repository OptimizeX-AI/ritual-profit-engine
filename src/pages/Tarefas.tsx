import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Clock, AlertTriangle, CheckCircle2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = "todo" | "in_progress" | "waiting_approval" | "done" | "late";

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  assignee: string;
  deadline: string;
  status: TaskStatus;
  timeSpent: number;
  estimatedTime: number;
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Criar campanhas Google Ads - Janeiro",
    description: "Setup de 5 campanhas de search + display",
    project: "Empresa Alpha",
    assignee: "Maria Silva",
    deadline: "2026-01-15",
    status: "in_progress",
    timeSpent: 180,
    estimatedTime: 240,
  },
  {
    id: "2",
    title: "Relatório mensal de performance",
    description: "Consolidar métricas de todas as plataformas",
    project: "Tech Solutions",
    assignee: "João Pedro",
    deadline: "2026-01-10",
    status: "late",
    timeSpent: 60,
    estimatedTime: 120,
  },
  {
    id: "3",
    title: "Aprovar artes Instagram - Feed",
    description: "10 artes para aprovação do cliente",
    project: "Startup Beta",
    assignee: "Ana Lima",
    deadline: "2026-01-18",
    status: "waiting_approval",
    timeSpent: 300,
    estimatedTime: 300,
  },
  {
    id: "4",
    title: "Setup pixel Facebook",
    description: "Implementar eventos de conversão",
    project: "Comércio Plus",
    assignee: "Carlos Roberto",
    deadline: "2026-01-20",
    status: "todo",
    timeSpent: 0,
    estimatedTime: 60,
  },
  {
    id: "5",
    title: "Otimização SEO - Páginas de produto",
    description: "Meta tags + conteúdo para 20 páginas",
    project: "Indústria XYZ",
    assignee: "Lucia Pereira",
    deadline: "2026-01-12",
    status: "done",
    timeSpent: 480,
    estimatedTime: 400,
  },
];

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; className: string }> = {
  todo: { label: "A Fazer", icon: Clock, className: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em Andamento", icon: Play, className: "bg-pending/10 text-pending" },
  waiting_approval: { label: "Aguard. Cliente", icon: Pause, className: "bg-warning/10 text-warning" },
  done: { label: "Concluído", icon: CheckCircle2, className: "bg-profit/10 text-profit" },
  late: { label: "Atrasado", icon: AlertTriangle, className: "bg-loss/10 text-loss" },
};

export default function Tarefas() {
  const [filter, setFilter] = useState<string>("all");

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}d atrasado`;
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const filteredTasks = filter === "all" 
    ? tasks 
    : tasks.filter(t => t.status === filter);

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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar tarefa..." className="pl-9" />
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
              {tasks.filter(t => t.status === "late").length} atrasadas
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Pause className="h-3 w-3 text-warning" />
              {tasks.filter(t => t.status === "waiting_approval").length} aguardando
            </Badge>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
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
                const timePercent = Math.round((task.timeSpent / task.estimatedTime) * 100);
                
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
                          {task.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {task.project}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-sm",
                        task.status === "late" && "text-loss font-medium"
                      )}>
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
                              timePercent > 100 ? "bg-loss" : timePercent > 80 ? "bg-warning" : "bg-profit"
                            )}
                            style={{ width: `${Math.min(timePercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(task.timeSpent)}/{formatTime(task.estimatedTime)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Clock className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
