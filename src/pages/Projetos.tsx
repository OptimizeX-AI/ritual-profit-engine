import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, ScopeType } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import { useProjectStats } from "@/hooks/useProjectStats";

const SCOPE_OPTIONS: { value: ScopeType; label: string }[] = [
  { value: "horas_fechadas", label: "Horas Fechadas" },
  { value: "fee_mensal", label: "Fee Mensal" },
  { value: "pontual", label: "Projeto Pontual" },
];

export default function Projetos() {
  const navigate = useNavigate();
  const { projects, isLoading, createProject, isCreating } = useProjects();
  const { clients } = useClients();
  const { projectStats, isLoading: isLoadingStats } = useProjectStats();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    client_id: "",
    name: "",
    horas_contratadas: 0,
    scope_type: "fee_mensal" as ScopeType,
  });

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.client_id) return;
    createProject({
      ...newProject,
      initial_budget_hours: newProject.horas_contratadas,
    });
    setNewProject({ client_id: "", name: "", horas_contratadas: 0, scope_type: "fee_mensal" });
    setDialogOpen(false);
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
  };

  const getOverservicingStatus = (
    horasContratadas: number,
    horasRealizadas: number
  ) => {
    if (horasContratadas === 0) return { status: "neutral", percent: 0 };
    const percent = (horasRealizadas / horasContratadas) * 100;

    if (percent > 120) return { status: "critical", percent };
    if (percent > 100) return { status: "warning", percent };
    if (percent > 80) return { status: "attention", percent };
    return { status: "healthy", percent };
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
            <p className="text-muted-foreground">
              Gestão de escopo e over-servicing
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Projeto</DialogTitle>
                <DialogDescription>
                  Adicione um novo projeto ao sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={newProject.client_id}
                    onValueChange={(v) =>
                      setNewProject({ ...newProject, client_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Projeto *</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    placeholder="Ex: Campanha Black Friday 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horas">Horas Contratadas (escopo)</Label>
                  <Input
                    id="horas"
                    type="number"
                    value={newProject.horas_contratadas}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        horas_contratadas: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: 40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope">Tipo de Escopo</Label>
                  <Select
                    value={newProject.scope_type}
                    onValueChange={(v) =>
                      setNewProject({ ...newProject, scope_type: v as ScopeType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={
                    isCreating || !newProject.name || !newProject.client_id
                  }
                >
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Projeto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projeto..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Projects Grid */}
        {isLoading || isLoadingStats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhum projeto encontrado
            </p>
            <p className="text-sm text-muted-foreground">
              Clique em "Novo Projeto" para adicionar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const stats = projectStats[project.id];
              const horasContratadas = (project.horas_contratadas || 0) * 60; // Convert to minutes
              const horasRealizadas = stats?.totalMinutes || 0;
              const { status, percent } = getOverservicingStatus(
                horasContratadas,
                horasRealizadas
              );

              const client = clients.find((c) => c.id === project.client_id);

              return (
                <Card
                  key={project.id}
                  className={cn(
                    "transition-all duration-200 hover:shadow-md cursor-pointer",
                    status === "critical" && "border-loss/50 bg-loss/5",
                    status === "warning" && "border-warning/50 bg-warning/5"
                  )}
                  onClick={() => navigate(`/projetos/${project.id}`)}
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
                            <p>
                              Horas realizadas excedem significativamente o
                              escopo contratado
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {status === "warning" && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="gap-1 bg-warning text-warning-foreground">
                              <TrendingUp className="h-3 w-3" />
                              Atenção
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Projeto ultrapassou o escopo contratado</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {status === "healthy" && percent > 0 && (
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-profit/10 text-profit"
                        >
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
                            status === "critical" && "text-loss",
                            status === "warning" && "text-warning"
                          )}
                        >
                          {Math.round(percent)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percent, 100)}
                        className={cn(
                          "h-2",
                          status === "critical" && "[&>div]:bg-loss",
                          status === "warning" && "[&>div]:bg-warning",
                          status === "healthy" && "[&>div]:bg-profit",
                          status === "attention" && "[&>div]:bg-pending"
                        )}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Realizado: {formatHours(horasRealizadas)}
                        </span>
                        <span>
                          Contratado: {formatHours(horasContratadas)}
                        </span>
                      </div>
                    </div>

                    {/* Task Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {stats?.totalTasks || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Tarefas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-profit">
                          {stats?.completedTasks || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Concluídas
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-lg font-semibold",
                            (stats?.lateTasks || 0) > 0 && "text-loss"
                          )}
                        >
                          {stats?.lateTasks || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Atrasadas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
