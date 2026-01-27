import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, AlertTriangle, Clock, Battery, Loader2, Calendar, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkloadCapacity, TeamMemberWorkload } from "@/hooks/useWorkloadCapacity";

const statusConfig = {
  healthy: {
    label: "Saudável",
    color: "bg-profit",
    textColor: "text-profit",
    bgColor: "bg-profit/10",
  },
  attention: {
    label: "Atenção",
    color: "bg-warning",
    textColor: "text-warning",
    bgColor: "bg-warning/10",
  },
  overloaded: {
    label: "Sobrecarga",
    color: "bg-loss",
    textColor: "text-loss",
    bgColor: "bg-loss/10",
  },
};

export default function Capacidade() {
  const { workloadData, overloadedCount, attentionCount, isLoading } =
    useWorkloadCapacity();
  const [selectedMember, setSelectedMember] = useState<TeamMemberWorkload | null>(null);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
  };

  const healthyCount = workloadData.filter((m) => m.status === "healthy").length;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestão de Capacidade
          </h1>
          <p className="text-muted-foreground">
            "Não adianta cobrar prazo se não cabe na agenda." - Lázaro do Carmo
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-profit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Battery className="h-4 w-4" />
                Saudáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-profit">{healthyCount}</p>
              <p className="text-xs text-muted-foreground">
                {"<"} 80% da capacidade
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-warning">{attentionCount}</p>
              <p className="text-xs text-muted-foreground">80-100% da capacidade</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-loss">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Sobrecarga (Risco de Burnout)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-loss">{overloadedCount}</p>
              <p className="text-xs text-muted-foreground">{"> "}100% da capacidade</p>
            </CardContent>
          </Card>
        </div>

        {/* Workload Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Carga de Trabalho da Equipe
            </CardTitle>
            <CardDescription>
              Horas alocadas em tarefas ativas vs. capacidade semanal (40h padrão)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : workloadData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum membro da equipe encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workloadData.map((member) => {
                  const config = statusConfig[member.status];
                  const barWidth = Math.min(member.utilizationPercent, 150);

                  return (
                    <Tooltip key={member.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="group cursor-pointer rounded-lg p-3 hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {member.tasks.length} tarefa{member.tasks.length !== 1 ? "s" : ""} ativa{member.tasks.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-semibold",
                                  config.bgColor,
                                  config.textColor
                                )}
                              >
                                {config.label}
                              </Badge>
                              <span className="text-sm font-medium w-24 text-right">
                                {member.allocatedHours}h / {member.weeklyCapacityHours}h
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                            {/* Capacity line at 100% */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-foreground/30 z-10"
                              style={{ left: "66.67%" }}
                            />
                            <div
                              className={cn(
                                "h-full rounded-full transition-all relative",
                                config.color
                              )}
                              style={{
                                width: `${(barWidth / 150) * 100}%`,
                              }}
                            >
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                {member.utilizationPercent}%
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                            <span>0h</span>
                            <span>{Math.round(member.weeklyCapacityHours * 0.5)}h</span>
                            <span>{member.weeklyCapacityHours}h (100%)</span>
                            <span>{Math.round(member.weeklyCapacityHours * 1.5)}h</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Clique para ver detalhes das tarefas</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Details Sheet */}
        <Sheet open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {selectedMember?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                {selectedMember?.name}
              </SheetTitle>
              <SheetDescription>
                {selectedMember && (
                  <span className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        statusConfig[selectedMember.status].bgColor,
                        statusConfig[selectedMember.status].textColor
                      )}
                    >
                      {statusConfig[selectedMember.status].label}
                    </Badge>
                    <span>
                      {selectedMember.allocatedHours}h alocadas de{" "}
                      {selectedMember.weeklyCapacityHours}h ({selectedMember.utilizationPercent}%)
                    </span>
                  </span>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Tarefas Ativas ({selectedMember?.tasks.length || 0})
              </h4>

              {selectedMember?.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  Nenhuma tarefa ativa atribuída.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedMember?.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {task.projectName && (
                          <Badge variant="secondary" className="gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {task.projectName}
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(task.estimatedMinutes)}
                        </Badge>
                        {task.deadline && (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.deadline).toLocaleDateString("pt-BR")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </MainLayout>
  );
}
