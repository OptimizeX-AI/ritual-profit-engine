import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useCRMKanban, CRM_STAGES, CRMDeal, CRMStageId, CreateDealInput, DealOrigin } from "@/hooks/useCRMKanban";
import { useTeamMembers } from "@/hooks/useTeamMembers";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, Building2, DollarSign, Calendar, Loader2, Trash2, TrendingUp, User, Filter, Megaphone, Users, Phone, Globe, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateProjectFromDealModal } from "@/components/projects/CreateProjectFromDealModal";
import { LossReasonModal, LossReasonValue } from "@/components/crm/LossReasonModal";

const ORIGIN_CONFIG: Record<DealOrigin, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  ads: { label: "Ads", color: "bg-blue-500 text-white", icon: Megaphone },
  indicacao: { label: "Indicação", color: "bg-yellow-500 text-black", icon: Users },
  outbound: { label: "Outbound", color: "bg-purple-500 text-white", icon: Phone },
  organic: { label: "Orgânico", color: "bg-green-600 text-white", icon: Globe },
};

interface DealCardProps {
  deal: CRMDeal;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (deal: CRMDeal) => void;
}

function DealCard({ deal, index, onDelete, onEdit }: DealCardProps) {
  const originConfig = ORIGIN_CONFIG[deal.origin || "organic"];
  const OriginIcon = originConfig.icon;

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
                <DropdownMenuItem onClick={() => onEdit(deal)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
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

          {/* Origin Badge */}
          <div className="mb-2">
            <Badge className={cn("text-[10px] px-1.5 py-0.5", originConfig.color)}>
              <OriginIcon className="h-3 w-3 mr-1" />
              {originConfig.label}
            </Badge>
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
  onEdit: (deal: CRMDeal) => void;
  onAddClick: (stageId: CRMStageId) => void;
}

function StageColumn({ stageId, label, deals, onDelete, onEdit, onAddClick }: StageColumnProps) {
  const stageValue = deals.reduce((sum, d) => sum + d.value_centavos, 0);
  
  const colorMap: Record<CRMStageId, string> = {
    prospecting: "border-t-muted-foreground",
    proposal: "border-t-pending",
    negotiation: "border-t-warning",
    closed_won: "border-t-profit",
    closed_lost: "border-t-destructive",
  };

  // Don't show add button for closed stages
  const showAddButton = stageId !== "closed_won" && stageId !== "closed_lost";

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
              <DealCard key={deal.id} deal={deal} index={index} onDelete={onDelete} onEdit={onEdit} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {showAddButton && (
        <Button
          variant="ghost"
          className="w-full border-dashed border text-muted-foreground text-sm h-9 mt-2"
          onClick={() => onAddClick(stageId)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      )}
    </div>
  );
}

export function CRMKanbanBoard() {
  const {
    deals,
    dealsByStage,
    pipelineValue,
    isLoading,
    updateStage,
    updateDeal,
    createDeal,
    deleteDeal,
    provisionCommission,
    isCreating,
    isUpdating,
  } = useCRMKanban();

  const { members } = useTeamMembers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<CreateDealInput>({
    company: "",
    contact: "",
    value_centavos: 0,
    probability: 20,
    stage: "prospecting",
    origin: "organic",
  });

  // Edit deal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<CRMDeal | null>(null);

  // Filter by salesperson
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");

  // State for deal → project conversion
  const [dealToConvert, setDealToConvert] = useState<CRMDeal | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [pendingDragResult, setPendingDragResult] = useState<DropResult | null>(null);

  // State for loss reason modal
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [dealToLose, setDealToLose] = useState<CRMDeal | null>(null);
  const [pendingLossResult, setPendingLossResult] = useState<DropResult | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination, source } = result;
    const newStage = destination.droppableId as CRMStageId;
    const oldStage = source.droppableId as CRMStageId;

    // Find the deal
    const deal = deals.find((d) => d.id === draggableId);
    if (!deal) return;

    // If moving to closed_won, show project creation modal
    if (newStage === "closed_won" && oldStage !== "closed_won") {
      setDealToConvert(deal);
      setPendingDragResult(result);
      setProjectModalOpen(true);
      return;
    }

    // If moving to closed_lost, show loss reason modal
    if (newStage === "closed_lost" && oldStage !== "closed_lost") {
      setDealToLose(deal);
      setPendingLossResult(result);
      setLossModalOpen(true);
      return;
    }

    // Normal stage update
    updateStage({ id: draggableId, stage: newStage });
  };

  const handleProjectCreated = () => {
    if (pendingDragResult) {
      const { draggableId, destination } = pendingDragResult;
      const newStage = destination!.droppableId as CRMStageId;
      const deal = deals.find((d) => d.id === draggableId);
      
      // Update stage
      updateStage({ id: draggableId, stage: newStage });
      
      // Provision commission if salesperson is assigned
      if (deal && deal.salesperson_id) {
        provisionCommission({
          dealId: deal.id,
          dealValue: deal.value_centavos,
          salespersonId: deal.salesperson_id,
        });
      }
    }
    setPendingDragResult(null);
    setDealToConvert(null);
  };

  const handleProjectModalClose = (open: boolean) => {
    if (!open) {
      setPendingDragResult(null);
      setDealToConvert(null);
    }
    setProjectModalOpen(open);
  };

  const handleLossConfirm = (reason: LossReasonValue, notes: string) => {
    if (pendingLossResult && dealToLose) {
      const { draggableId, destination } = pendingLossResult;
      const newStage = destination!.droppableId as CRMStageId;
      
      updateStage({ 
        id: draggableId, 
        stage: newStage, 
        loss_reason: notes ? `${reason}: ${notes}` : reason 
      });
    }
    setPendingLossResult(null);
    setDealToLose(null);
    setLossModalOpen(false);
  };

  const handleLossModalClose = (open: boolean) => {
    if (!open) {
      setPendingLossResult(null);
      setDealToLose(null);
    }
    setLossModalOpen(open);
  };

  const handleCreateDeal = () => {
    if (!newDeal.company) return;
    createDeal(newDeal);
    setNewDeal({ company: "", contact: "", value_centavos: 0, probability: 20, stage: "prospecting", origin: "organic" });
    setDialogOpen(false);
  };

  const handleAddClick = (stageId: CRMStageId) => {
    setNewDeal({ ...newDeal, stage: stageId });
    setDialogOpen(true);
  };

  const handleEditClick = (deal: CRMDeal) => {
    setDealToEdit(deal);
    setEditDialogOpen(true);
  };

  const handleUpdateDeal = () => {
    if (!dealToEdit) return;
    updateDeal({
      id: dealToEdit.id,
      company: dealToEdit.company,
      contact: dealToEdit.contact,
      value_centavos: dealToEdit.value_centavos,
      probability: dealToEdit.probability,
      origin: dealToEdit.origin,
      salesperson_id: dealToEdit.salesperson_id,
      expected_close_date: dealToEdit.expected_close_date,
      notes: dealToEdit.notes,
    });
    setEditDialogOpen(false);
    setDealToEdit(null);
  };

  // Filter deals by salesperson
  const filteredDealsByStage = Object.fromEntries(
    Object.entries(dealsByStage).map(([stage, stageDeals]) => [
      stage,
      salespersonFilter === "all"
        ? stageDeals
        : stageDeals.filter((d) => d.salesperson_id === salespersonFilter),
    ])
  ) as Record<CRMStageId, CRMDeal[]>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline KPI + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Card className="flex-1">
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

        {/* Salesperson Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os vendedores</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4">
          {CRM_STAGES.map((stage) => (
            <StageColumn
              key={stage.id}
              stageId={stage.id}
              label={stage.label}
              deals={filteredDealsByStage[stage.id]}
              onDelete={deleteDeal}
              onEdit={handleEditClick}
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origem do Lead</Label>
                <Select
                  value={newDeal.origin}
                  onValueChange={(v) => setNewDeal({ ...newDeal, origin: v as DealOrigin })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORIGIN_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesperson">Vendedor</Label>
                <Select
                  value={newDeal.salesperson_id || "none"}
                  onValueChange={(v) => setNewDeal({ ...newDeal, salesperson_id: v === "none" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

      {/* Edit Deal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setDealToEdit(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Negócio</DialogTitle>
            <DialogDescription>Atualize as informações do negócio.</DialogDescription>
          </DialogHeader>
          {dealToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Empresa</Label>
                <Input
                  id="edit-company"
                  value={dealToEdit.company}
                  onChange={(e) => setDealToEdit({ ...dealToEdit, company: e.target.value })}
                  placeholder="Ex: Empresa ABC Ltda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Contato</Label>
                <Input
                  id="edit-contact"
                  value={dealToEdit.contact || ""}
                  onChange={(e) => setDealToEdit({ ...dealToEdit, contact: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-value">Valor Mensal (R$)</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    value={(dealToEdit.value_centavos || 0) / 100}
                    onChange={(e) =>
                      setDealToEdit({
                        ...dealToEdit,
                        value_centavos: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-probability">Probabilidade (%)</Label>
                  <Input
                    id="edit-probability"
                    type="number"
                    min="0"
                    max="100"
                    value={dealToEdit.probability}
                    onChange={(e) =>
                      setDealToEdit({
                        ...dealToEdit,
                        probability: parseInt(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-origin">Origem do Lead</Label>
                  <Select
                    value={dealToEdit.origin}
                    onValueChange={(v) => setDealToEdit({ ...dealToEdit, origin: v as DealOrigin })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ORIGIN_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-salesperson">Vendedor</Label>
                  <Select
                    value={dealToEdit.salesperson_id || "none"}
                    onValueChange={(v) => setDealToEdit({ ...dealToEdit, salesperson_id: v === "none" ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setDealToEdit(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDeal} disabled={isUpdating || !dealToEdit?.company}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
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

      {/* Loss Reason Modal */}
      <LossReasonModal
        open={lossModalOpen}
        onOpenChange={handleLossModalClose}
        onConfirm={handleLossConfirm}
        dealName={dealToLose?.company || ""}
      />
    </div>
  );
}
