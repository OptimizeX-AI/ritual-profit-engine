import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClients, Client } from "@/hooks/useClients";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Building2, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { CRMDeal } from "@/hooks/useCRMKanban";

interface CreateProjectFromDealModalProps {
  deal: CRMDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProjectFromDealModal({
  deal,
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectFromDealModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clients, createClient, isCreating: isCreatingClient } = useClients();

  const [projectName, setProjectName] = useState("");
  const [horasVendidas, setHorasVendidas] = useState<number>(0);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [createNewClient, setCreateNewClient] = useState(false);

  // Check if client already exists
  const existingClient = deal 
    ? clients.find(c => c.name.toLowerCase() === deal.company.toLowerCase())
    : null;

  // Initialize form when deal changes
  useState(() => {
    if (deal) {
      setProjectName(`${deal.company} - Gestão Mensal`);
      setSelectedClientId(existingClient?.id || "");
      setCreateNewClient(!existingClient);
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async ({ clientId, name, horas }: { clientId: string; name: string; horas: number }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          client_id: clientId,
          name,
          horas_contratadas: horas,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto criado com sucesso! 🎉");
      onSuccess();
      onOpenChange(false);
      navigate(`/projetos`);
    },
    onError: (error) => {
      toast.error("Erro ao criar projeto: " + (error as Error).message);
    },
  });

  const handleSubmit = async () => {
    if (!deal || horasVendidas <= 0) {
      toast.error("Informe as horas vendidas");
      return;
    }

    try {
      let clientId = selectedClientId;

      // Create new client if needed
      if (createNewClient || !clientId) {
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert({
            organization_id: deal.organization_id,
            name: deal.company,
            fee_mensal_centavos: deal.value_centavos,
            contrato_inicio: new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (error) throw error;
        clientId = newClient.id;
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      }

      // Create project
      createProjectMutation.mutate({
        clientId,
        name: projectName || `${deal.company} - Gestão Mensal`,
        horas: horasVendidas,
      });
    } catch (error) {
      toast.error("Erro ao criar cliente: " + (error as Error).message);
    }
  };

  const isLoading = createProjectMutation.isPending || isCreatingClient;

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-profit" />
            Novo Projeto Ganho! 🎉
          </DialogTitle>
          <DialogDescription>
            Configure o projeto para o deal fechado e inicie a operação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Deal Info (readonly) */}
          <div className="p-4 rounded-lg bg-profit/10 border border-profit/30 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-profit">
              <Building2 className="h-4 w-4" />
              {deal.company}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                R$ {(deal.value_centavos / 100).toLocaleString("pt-BR")}
              </span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Nome do Projeto</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={`${deal.company} - Gestão Mensal`}
            />
          </div>

          {/* Client Selection */}
          {existingClient ? (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                Cliente existente: <strong>{existingClient.name}</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Criar novo cliente automaticamente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">➕ Criar novo: {deal.company}</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Horas Vendidas (required) */}
          <div className="space-y-2">
            <Label htmlFor="horasVendidas" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horas Vendidas (escopo) *
            </Label>
            <Input
              id="horasVendidas"
              type="number"
              min={1}
              value={horasVendidas || ""}
              onChange={(e) => setHorasVendidas(parseInt(e.target.value) || 0)}
              placeholder="Ex: 40"
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Quantidade de horas contratadas para este projeto
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || horasVendidas <= 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
