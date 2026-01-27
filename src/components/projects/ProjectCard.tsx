import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/useProjects";
import { Client } from "@/hooks/useClients";

interface ProjectCardProps {
  project: Project;
  client?: Client;
  stats?: {
    totalMinutes: number;
    totalTasks: number;
    completedTasks: number;
    lateTasks: number;
  };
}

export function ProjectCard({ project, client, stats }: ProjectCardProps) {
  const horasContratadas = (project.horas_contratadas || 0) * 60; // Convert to minutes
  const horasRealizadas = stats?.totalMinutes || 0;
  
  // Calculate percentage
  const percent = horasContratadas > 0 
    ? (horasRealizadas / horasContratadas) * 100 
    : 0;

  // Determine status based on percentage
  const getStatus = () => {
    if (horasContratadas === 0) return "neutral";
    if (percent > 100) return "critical";
    if (percent > 80) return "warning";
    return "healthy";
  };

  const status = getStatus();

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
  };

  // Get progress bar color class
  const getProgressColor = () => {
    if (percent < 80) return "bg-green-500";
    if (percent <= 100) return "bg-yellow-500";
    return "bg-red-600";
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md relative overflow-hidden",
        status === "critical" && "border-red-500/50 bg-red-500/5",
        status === "warning" && "border-yellow-500/50 bg-yellow-500/5"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {project.name}
            </CardTitle>
            <CardDescription>{client?.name || "-"}</CardDescription>
          </div>
          {status === "critical" && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Over-servicing
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Projeto em over-servicing (horas acima do vendido)</p>
              </TooltipContent>
            </Tooltip>
          )}
          {status === "warning" && (
            <Tooltip>
              <TooltipTrigger>
                <Badge className="gap-1 bg-yellow-500 text-white hover:bg-yellow-600">
                  <TrendingUp className="h-3 w-3" />
                  Atenção
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Projeto próximo ao limite de horas</p>
              </TooltipContent>
            </Tooltip>
          )}
          {status === "healthy" && percent > 0 && (
            <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              No prazo
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hours Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Escopo vs Realizado
            </span>
            <span
              className={cn(
                "font-medium",
                status === "critical" && "text-red-600",
                status === "warning" && "text-yellow-600"
              )}
            >
              {Math.round(percent)}%
            </span>
          </div>
          <Progress
            value={Math.min(percent, 100)}
            className={cn(
              "h-2",
              status === "critical" && "[&>div]:bg-red-600",
              status === "warning" && "[&>div]:bg-yellow-500",
              status === "healthy" && "[&>div]:bg-green-500"
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Realizado: {formatHours(horasRealizadas)}</span>
            <span>Contratado: {formatHours(horasContratadas)}</span>
          </div>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-semibold">{stats?.totalTasks || 0}</p>
            <p className="text-xs text-muted-foreground">Tarefas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">
              {stats?.completedTasks || 0}
            </p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-lg font-semibold",
                (stats?.lateTasks || 0) > 0 && "text-red-600"
              )}
            >
              {stats?.lateTasks || 0}
            </p>
            <p className="text-xs text-muted-foreground">Atrasadas</p>
          </div>
        </div>
      </CardContent>

      {/* Progress bar at bottom of card */}
      <div className={cn("absolute bottom-0 left-0 right-0 h-1", getProgressColor())} 
           style={{ width: `${Math.min(percent, 100)}%` }} />
    </Card>
  );
}
