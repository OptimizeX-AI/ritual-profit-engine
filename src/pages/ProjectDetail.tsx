import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useProjectDetail } from "@/hooks/useProjects";
import { useProjectAddendums } from "@/hooks/useProjectAddendums";
import { useProjectHoursConsumed } from "@/hooks/useProjectHoursConsumed";
import { useTransactions } from "@/hooks/useTransactions";
import { useOrganization } from "@/contexts/OrganizationContext";
import { ProjectFuelGauge } from "@/components/projects/ProjectFuelGauge";
import { AddendumModal } from "@/components/projects/AddendumModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SCOPE_LABELS = {
  horas_fechadas: "Horas Fechadas",
  fee_mensal: "Fee Mensal",
  pontual: "Projeto Pontual",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization } = useOrganization();
  
  const { data: project, isLoading: loadingProject } = useProjectDetail(id);
  const { addendums, isLoading: loadingAddendums, createAddendum, isCreating } = useProjectAddendums(id);
  const { data: hoursData, isLoading: loadingHours } = useProjectHoursConsumed(id);
  const { createTransaction } = useTransactions();

  const [addendumModalOpen, setAddendumModalOpen] = useState(false);

  const handleCreateAddendum = (data: {
    description: string;
    hours_added: number;
    cost_added_centavos: number;
    approved_by_client: boolean;
    createTransaction: boolean;
  }) => {
    if (!id) return;

    createAddendum({
      project_id: id,
      description: data.description,
      hours_added: data.hours_added,
      cost_added_centavos: data.cost_added_centavos,
      approved_by_client: data.approved_by_client,
    });

    // Create revenue transaction if requested
    if (data.createTransaction && data.cost_added_centavos > 0 && organization?.id) {
      createTransaction({
        description: `Aditivo - ${data.description}`,
        category: "Aditivos de Projeto",
        type: "receita",
        value_centavos: data.cost_added_centavos,
        status: "pendente",
        project_id: id,
      });
    }

    setAddendumModalOpen(false);
  };

  if (loadingProject || loadingAddendums || loadingHours) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <Button variant="ghost" onClick={() => navigate("/projetos")} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <p className="text-muted-foreground">Projeto não encontrado.</p>
        </div>
      </MainLayout>
    );
  }

  const budgetHours = project.current_budget_hours || project.initial_budget_hours || 0;
  const consumedHours = hoursData?.workedHours || 0;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/projetos")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <Badge variant="secondary">
                  {SCOPE_LABELS[project.scope_type as keyof typeof SCOPE_LABELS] || project.scope_type}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {project.clients?.name || "Cliente não definido"}
              </p>
            </div>
          </div>
          <Button onClick={() => setAddendumModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Aditivo
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Fuel Gauge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tanque de Horas
              </CardTitle>
              <CardDescription>
                Budget total: {budgetHours}h
                {project.initial_budget_hours !== project.current_budget_hours && (
                  <span className="text-profit ml-1">
                    (+{(project.current_budget_hours - project.initial_budget_hours).toFixed(1)}h aditivos)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectFuelGauge
                budgetHours={budgetHours}
                consumedHours={consumedHours}
              />
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="addendums">
              <TabsList>
                <TabsTrigger value="addendums" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Aditivos ({addendums.length})
                </TabsTrigger>
                <TabsTrigger value="financeiro" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  P&L do Projeto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="addendums" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Aditivos</CardTitle>
                    <CardDescription>
                      Change orders e alterações de escopo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {addendums.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum aditivo registrado para este projeto.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Horas</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Aprovado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {addendums.map((addendum) => (
                            <TableRow key={addendum.id}>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(addendum.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="font-medium">{addendum.description}</TableCell>
                              <TableCell className="text-right text-profit">
                                +{addendum.hours_added}h
                              </TableCell>
                              <TableCell className="text-right">
                                {addendum.cost_added_centavos > 0
                                  ? `R$ ${(addendum.cost_added_centavos / 100).toLocaleString("pt-BR")}`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {addendum.approved_by_client ? (
                                  <CheckCircle2 className="h-4 w-4 text-profit mx-auto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financeiro" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>P&L do Projeto</CardTitle>
                    <CardDescription>
                      Receita menos custos associados a este projeto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      Em desenvolvimento - vinculação de transações ao projeto
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Addendum Modal */}
      <AddendumModal
        open={addendumModalOpen}
        onOpenChange={setAddendumModalOpen}
        onConfirm={handleCreateAddendum}
        isLoading={isCreating}
        projectName={project.name}
      />
    </MainLayout>
  );
}
