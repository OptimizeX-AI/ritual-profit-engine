import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, DollarSign } from "lucide-react";

interface AddendumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    description: string;
    hours_added: number;
    cost_added_centavos: number;
    approved_by_client: boolean;
    createTransaction: boolean;
  }) => void;
  isLoading?: boolean;
  projectName: string;
}

export function AddendumModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  projectName,
}: AddendumModalProps) {
  const [description, setDescription] = useState("");
  const [hoursAdded, setHoursAdded] = useState(0);
  const [costAdded, setCostAdded] = useState(0);
  const [approvedByClient, setApprovedByClient] = useState(false);
  const [createTransaction, setCreateTransaction] = useState(false);

  const handleConfirm = () => {
    if (!description.trim()) return;
    onConfirm({
      description,
      hours_added: hoursAdded,
      cost_added_centavos: Math.round(costAdded * 100),
      approved_by_client: approvedByClient,
      createTransaction,
    });
    // Reset
    setDescription("");
    setHoursAdded(0);
    setCostAdded(0);
    setApprovedByClient(false);
    setCreateTransaction(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Aditivo
          </DialogTitle>
          <DialogDescription>
            Adicione horas extras ao projeto <strong>{projectName}</strong>.
            Isso aumentará o budget de horas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="addendum-description">
              Descrição do Aditivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="addendum-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Alteração de layout conforme solicitação do cliente..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours-added">Horas Adicionadas</Label>
              <Input
                id="hours-added"
                type="number"
                min="0"
                step="0.5"
                value={hoursAdded}
                onChange={(e) => setHoursAdded(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost-added">Valor Cobrado (R$)</Label>
              <Input
                id="cost-added"
                type="number"
                min="0"
                step="0.01"
                value={costAdded}
                onChange={(e) => setCostAdded(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 1500,00"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="approved-client"
              checked={approvedByClient}
              onCheckedChange={(checked) => setApprovedByClient(checked as boolean)}
            />
            <Label htmlFor="approved-client" className="text-sm font-normal">
              Cliente aprovou este aditivo
            </Label>
          </div>

          {costAdded > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-profit/10 rounded-lg border border-profit/20">
              <Checkbox
                id="create-transaction"
                checked={createTransaction}
                onCheckedChange={(checked) => setCreateTransaction(checked as boolean)}
              />
              <Label htmlFor="create-transaction" className="text-sm font-normal flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-profit" />
                Criar receita pendente de R$ {costAdded.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no financeiro
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!description.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Aditivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
