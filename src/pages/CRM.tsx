import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MoreHorizontal, Building2, DollarSign, Calendar, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeals, Deal, DealStage, CreateDealInput } from "@/hooks/useDeals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PipelineStage {
  id: DealStage;
  name: string;
  color: string;
}

const stages: PipelineStage[] = [
  { id: "prospecting", name: "Prospecção", color: "border-t-muted-foreground" },
  { id: "proposal", name: "Proposta Enviada", color: "border-t-pending" },
  { id: "negotiation", name: "Negociação", color: "border-t-warning" },
  { id: "closed_won", name: "Fechado ✓", color: "border-t-profit" },
];

function DealCard({ deal, onDelete }: { deal: Deal; onDelete: (id: string) => void }) {
  return (
    <div className="bg-card rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{deal.company}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(deal.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm">
          <DollarSign className="h-3.5 w-3.5 text-profit" />
          <span className="font-semibold text-profit">
            R$ {(deal.value_centavos / 100).toLocaleString("pt-BR")}
          </span>
          <span className="text-xs text-muted-foreground">/mês</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{deal.contact || "-"}</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{deal.days_in_stage}d</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${deal.probability}%` }}
            />
          </div>
          <span className="text-xs font-medium">{deal.probability}%</span>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const { deals, dealsByStage, isLoading, createDeal, deleteDeal, isCreating } = useDeals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<CreateDealInput>({
    company: "",
    contact: "",
    value_centavos: 0,
    probability: 20,
    stage: "prospecting",
  });

  const handleCreateDeal = () => {
    if (!newDeal.company) return;
    createDeal(newDeal);
    setNewDeal({ company: "", contact: "", value_centavos: 0, probability: 20, stage: "prospecting" });
    setDialogOpen(false);
  };

  const totalPipeline = deals
    .filter((d) => d.stage !== "closed_lost")
    .reduce((acc, d) => acc + d.value_centavos, 0);

  const weightedPipeline = deals
    .filter((d) => d.stage !== "closed_lost")
    .reduce((acc, d) => acc + d.value_centavos * (d.probability / 100), 0);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CRM - Pipeline de Vendas</h1>
            <p className="text-muted-foreground">Gerencie seus negócios em andamento</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Negócio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Negócio</DialogTitle>
                <DialogDescription>Adicione um novo negócio ao pipeline.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={newDeal.company}
                    onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                    placeholder="Ex: Empresa ABC Ltda"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contato</Label>
                  <Input
                    id="contact"
                    value={newDeal.contact}
                    onChange={(e) => setNewDeal({ ...newDeal, contact: e.target.value })}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Mensal (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={(newDeal.value_centavos || 0) / 100}
                    onChange={(e) =>
                      setNewDeal({
                        ...newDeal,
                        value_centavos: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probability">Probabilidade (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={newDeal.probability}
                    onChange={(e) =>
                      setNewDeal({
                        ...newDeal,
                        probability: parseInt(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateDeal} disabled={isCreating || !newDeal.company}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Negócio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pipeline Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Pipeline Total</div>
              <div className="text-2xl font-bold">
                R$ {(totalPipeline / 100).toLocaleString("pt-BR")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {deals.filter((d) => d.stage !== "closed_lost").length} negócios ativos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Previsão Ponderada</div>
              <div className="text-2xl font-bold text-profit">
                R$ {(weightedPipeline / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Baseado na probabilidade</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
              <div className="text-2xl font-bold">
                {deals.length > 0
                  ? Math.round(
                      (dealsByStage.closed_won.length / deals.length) * 100
                    )
                  : 0}
                %
              </div>
              <div className="text-xs text-muted-foreground mt-1">Negócios fechados</div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {stages.map((stage) => {
              const stageDeals = dealsByStage[stage.id] || [];
              return (
                <div key={stage.id} className="space-y-3">
                  <div className={cn("rounded-lg border-t-4 bg-muted/30 p-3", stage.color)}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{stage.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {stageDeals.length}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      R$ {(stageDeals.reduce((s, d) => s + d.value_centavos, 0) / 100).toLocaleString("pt-BR")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {stageDeals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} onDelete={deleteDeal} />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full border-dashed border text-muted-foreground text-sm h-9"
                    onClick={() => {
                      setNewDeal({ ...newDeal, stage: stage.id });
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
