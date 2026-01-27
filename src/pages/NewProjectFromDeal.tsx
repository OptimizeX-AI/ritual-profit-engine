import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Rocket, Clock, DollarSign } from "lucide-react";
import { useProjects, ScopeType } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import { useDeals } from "@/hooks/useDeals";
import { toast } from "sonner";

const SCOPE_OPTIONS: { value: ScopeType; label: string; description: string }[] = [
  { value: "horas_fechadas", label: "Horas Fechadas", description: "Escopo fixo com budget de horas" },
  { value: "fee_mensal", label: "Fee Mensal", description: "Retenção mensal contínua" },
  { value: "pontual", label: "Projeto Pontual", description: "Entrega única sem recorrência" },
];

export default function NewProjectFromDeal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dealId = searchParams.get("deal_id");

  const { createProject, isCreating } = useProjects();
  const { clients } = useClients();
  const { deals } = useDeals();

  const [form, setForm] = useState({
    client_id: "",
    name: "",
    scope_type: "fee_mensal" as ScopeType,
    initial_budget_hours: 0,
  });

  // Pre-fill from deal
  useEffect(() => {
    if (dealId && deals.length > 0) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        // Find or suggest client
        const matchingClient = clients.find(
          (c) => c.name.toLowerCase() === deal.company.toLowerCase()
        );

        // Suggest budget hours based on value (R$100/hora default)
        const suggestedHours = Math.round(deal.value_centavos / 10000);

        setForm({
          client_id: matchingClient?.id || "",
          name: deal.company,
          scope_type: "fee_mensal",
          initial_budget_hours: suggestedHours,
        });
      }
    }
  }, [dealId, deals, clients]);

  const deal = dealId ? deals.find((d) => d.id === dealId) : null;

  const handleCreate = () => {
    if (!form.name || !form.client_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createProject({
      client_id: form.client_id,
      name: form.name,
      scope_type: form.scope_type,
      initial_budget_hours: form.initial_budget_hours,
      horas_contratadas: form.initial_budget_hours,
    });

    navigate("/projetos");
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Rocket className="h-6 w-6 text-profit" />
              Passagem de Bastão
            </h1>
            <p className="text-muted-foreground">
              Transforme o deal fechado em um projeto operacional
            </p>
          </div>
        </div>

        {/* Deal Info */}
        {deal && (
          <Card className="border-profit/30 bg-profit/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-profit">Deal Fechado</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{deal.company}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="font-medium text-profit">
                  R$ {(deal.value_centavos / 100).toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Novo Projeto</CardTitle>
            <CardDescription>
              Defina o escopo e budget de horas para o novo projeto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm({ ...form, client_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deal && !form.client_id && (
                <p className="text-xs text-warning">
                  ⚠️ Cliente "{deal.company}" não encontrado. Crie-o primeiro ou selecione um existente.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Campanha Q1 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Tipo de Escopo</Label>
              <Select
                value={form.scope_type}
                onValueChange={(v) => setForm({ ...form, scope_type: v as ScopeType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Budget de Horas (Tanque Inicial)
              </Label>
              <Input
                id="budget"
                type="number"
                min="0"
                value={form.initial_budget_hours}
                onChange={(e) =>
                  setForm({ ...form, initial_budget_hours: parseFloat(e.target.value) || 0 })
                }
                placeholder="Ex: 40"
              />
              {deal && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Sugestão: {Math.round(deal.value_centavos / 10000)}h (baseado em R$100/hora)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !form.name || !form.client_id}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Projeto
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
