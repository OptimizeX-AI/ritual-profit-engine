import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle2, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  deadline: string;
  status: "on_time" | "late" | "waiting_approval" | "done";
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Criar campanhas Google Ads",
    project: "Empresa Alpha",
    assignee: "Maria S.",
    deadline: "Hoje",
    status: "on_time",
  },
  {
    id: "2",
    title: "Relatório mensal de performance",
    project: "Tech Solutions",
    assignee: "João P.",
    deadline: "Ontem",
    status: "late",
  },
  {
    id: "3",
    title: "Aprovar artes Instagram",
    project: "Startup Beta",
    assignee: "Ana L.",
    deadline: "15/01",
    status: "waiting_approval",
  },
  {
    id: "4",
    title: "Setup pixel Facebook",
    project: "Comércio Plus",
    assignee: "Carlos R.",
    deadline: "12/01",
    status: "done",
  },
];

const statusConfig = {
  on_time: {
    label: "No prazo",
    icon: Clock,
    className: "status-on-time",
  },
  late: {
    label: "Atrasada",
    icon: AlertTriangle,
    className: "status-late",
  },
  waiting_approval: {
    label: "Aguard. Cliente",
    icon: Pause,
    className: "status-waiting",
  },
  done: {
    label: "Concluída",
    icon: CheckCircle2,
    className: "status-on-time",
  },
};

export function TasksOverview() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Tarefas Críticas</CardTitle>
          <Badge variant="secondary" className="font-medium">
            {tasks.filter(t => t.status === 'late').length} atrasadas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const config = statusConfig[task.status];
            const StatusIcon = config.icon;
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  task.status === "late" && "table-row-late border-loss/20",
                  task.status === "waiting_approval" && "table-row-warning border-warning/20"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.project} • {task.assignee}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{task.deadline}</span>
                  <div className={config.className}>
                    <StatusIcon className="h-3 w-3" />
                    <span>{config.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
