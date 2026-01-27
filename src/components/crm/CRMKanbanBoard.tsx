import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useCRMKanban, CRM_STAGES, CRMDeal, CRMStageId, CreateDealInput } from "@/hooks/useCRMKanban";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Building2, DollarSign, Calendar, Loader2, Trash2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateProjectFromDealModal } from "@/components/projects/CreateProjectFromDealModal";

interface DealCardProps {
  deal: CRMDeal;
  index: number;
  onDelete: (id: string) => void;
}

function DealCard({ deal, index, onDelete }: DealCardProps) {
  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-card rounded-lg border p-3 shadow-sm transition-shadow",
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md"
          )}
        >
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
      )}
    </Draggable>
  );
}

interface StageColumnProps {
  stageId: CRMStageId;
  label: string;
  deals: CRMDeal[];
  onDelete: (id: string) => void;
  onAddClick: (stageId: CRMStageId) => void;
}

function StageColumn({ stageId, label, deals, onDelete, onAddClick }: StageColumnProps) {
  const stageValue = deals.reduce((sum, d) => sum + d.value_centavos, 0);
  
  const colorMap: Record<CRMStageId, string> = {
    prospecting: "border-t-muted-foreground",
    proposal: "border-t-pending",
    negotiation: "border-t-warning",
    closed_won: "border-t-profit",
  };

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div className={cn("rounded-lg border-t-4 bg-muted/30 p-3 mb-3", colorMap[stageId])}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{label}</h3>
          <Badge variant="secondary" className="text-xs">
            {deals.length}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          R$ {(stageValue / 100).toLocaleString("pt-BR")}
        </div>
      </div>

      <Droppable droppableId={stageId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 space-y-2 min-h-[200px] p-1 rounded-lg transition-colors",
              snapshot.isDraggingOver && "bg-muted/50"
            )}
          >
            {deals.map((deal, index) => (
              <DealCard key={deal.id} deal={deal} index={index} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <Button
        variant="ghost"
        className="w-full border-dashed border text-muted-foreground text-sm h-9 mt-2"
        onClick={() => onAddClick(stageId)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Adicionar
      </Button>
    </div>
  );
}

export function CRMKanbanBoard() {
  const {
    dealsByStage,
    pipelineValue,
    isLoading,
    updateStage,
    createDeal,
    deleteDeal,
    isCreating,
  } = useCRMKanban();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<CreateDealInput>({
    company: "",
    contact: "",
    value_centavos: 0,
    probability: 20,
    stage: "prospecting",
  });

  // State for deal → project conversion
  const [dealToConvert, setDealToConvert] = useState<CRMDeal | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [pendingDragResult, setPendingDragResult] = useState<DropResult | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination, source } = result;
    const newStage = destination.droppableId as CRMStageId;
    const oldStage = source.droppableId as CRMStageId;

    // If moving to closed_won, show project creation modal
    if (newStage === "closed_won" && oldStage !== "closed_won") {
      // Find the deal
      const deal = Object.values(dealsByStage)
        .flat()
        .find((d) => d.id === draggableId);
      
      if (deal) {
        setDealToConvert(deal);
        setPendingDragResult(result);
        setProjectModalOpen(true);
        return; // Don't update stage yet
      }
    }

    // Normal stage update
    updateStage({ id: draggableId, stage: newStage });
  };

  const handleProjectCreated = () => {
    // After project is created, update the deal stage
    if (pendingDragResult) {
      const { draggableId, destination } = pendingDragResult;
      const newStage = destination!.droppableId as CRMStageId;
      updateStage({ id: draggableId, stage: newStage });
    }
    setPendingDragResult(null);
    setDealToConvert(null);
  };

  const handleProjectModalClose = (open: boolean) => {
    if (!open) {
      // User cancelled, don't update stage
      setPendingDragResult(null);
      setDealToConvert(null);
    }
    setProjectModalOpen(open);
  };

  const handleCreateDeal = () => {
    if (!newDeal.company) return;
    createDeal(newDeal);
    setNewDeal({ company: "", contact: "", value_centavos: 0, probability: 20, stage: "prospecting" });
    setDialogOpen(false);
  };

  const handleAddClick = (stageId: CRMStageId) => {
    setNewDeal({ ...newDeal, stage: stageId });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline KPI */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-profit" />
            <div>
              <div className="text-sm text-muted-foreground">Pipeline Ponderado</div>
              <div className="text-3xl font-bold text-profit">
                R$ {(pipelineValue / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {CRM_STAGES.map((stage) => (
            <StageColumn
              key={stage.id}
              stageId={stage.id}
              label={stage.label}
              deals={dealsByStage[stage.id]}
              onDelete={deleteDeal}
              onAddClick={handleAddClick}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Create Deal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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

      {/* Create Project From Deal Modal */}
      <CreateProjectFromDealModal
        deal={dealToConvert}
        open={projectModalOpen}
        onOpenChange={handleProjectModalClose}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
