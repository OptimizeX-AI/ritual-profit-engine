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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";

export const LOSS_REASONS = [
  { value: "preco", label: "Preço" },
  { value: "escopo", label: "Escopo" },
  { value: "concorrente", label: "Concorrente" },
  { value: "timing", label: "Timing / Momento" },
  { value: "orcamento", label: "Sem Orçamento" },
  { value: "decisor", label: "Mudança de Decisor" },
  { value: "outro", label: "Outro" },
] as const;

export type LossReasonValue = (typeof LOSS_REASONS)[number]["value"];

interface LossReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: LossReasonValue, notes: string) => void;
  dealName: string;
  isLoading?: boolean;
}

export function LossReasonModal({
  open,
  onOpenChange,
  onConfirm,
  dealName,
  isLoading,
}: LossReasonModalProps) {
  const [reason, setReason] = useState<LossReasonValue | "">("");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, notes);
    setReason("");
    setNotes("");
  };

  const handleCancel = () => {
    setReason("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Negócio Perdido
          </DialogTitle>
          <DialogDescription>
            Registre o motivo da perda de <strong>{dealName}</strong> para
            análise futura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo da Perda <span className="text-destructive">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as LossReasonValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente optou pelo concorrente X por oferecer menor prazo..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Perda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
