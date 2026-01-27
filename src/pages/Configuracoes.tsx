import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building2, 
  Target, 
  Users, 
  DollarSign, 
  TrendingUp,
  Info,
  Loader2,
  Save,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIAS_RECEITA, CATEGORIAS_DESPESA } from "@/lib/financialValidation";

interface OrganizationGoals {
  meta_receita_liquida_centavos: number;
  teto_custos_fixos_centavos: number;
}

export default function Configuracoes() {
  const { organization, loading: orgLoading, refetch } = useOrganization();
  const [goals, setGoals] = useState<OrganizationGoals>({
    meta_receita_liquida_centavos: 0,
    teto_custos_fixos_centavos: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch organization goals
  useEffect(() => {
    const fetchGoals = async () => {
      if (!organization?.id) return;

      const { data, error } = await supabase
        .from("organizations")
        .select("meta_receita_liquida_centavos, teto_custos_fixos_centavos")
        .eq("id", organization.id)
        .maybeSingle();

      if (!error && data) {
        setGoals({
          meta_receita_liquida_centavos: data.meta_receita_liquida_centavos || 0,
          teto_custos_fixos_centavos: data.teto_custos_fixos_centavos || 0,
        });
      }
    };

    fetchGoals();
  }, [organization?.id]);

  const formatCurrency = (centavos: number): string => {
    if (centavos === 0) return "";
    return (centavos / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  };

  const handleGoalChange = (field: keyof OrganizationGoals, value: string) => {
    setGoals((prev) => ({
      ...prev,
      [field]: parseCurrency(value),
    }));
    setHasChanges(true);
  };

  const handleSaveGoals = async () => {
    if (!organization?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          meta_receita_liquida_centavos: goals.meta_receita_liquida_centavos,
          teto_custos_fixos_centavos: goals.teto_custos_fixos_centavos,
        })
        .eq("id", organization.id);

      if (error) throw error;

      toast.success("Metas salvas com sucesso!");
      setHasChanges(false);
      refetch();
    } catch (error) {
      console.error("Error saving goals:", error);
      toast.error("Erro ao salvar metas");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate expected EBITDA
  const expectedEbitda = goals.meta_receita_liquida_centavos - goals.teto_custos_fixos_centavos;
  const expectedMargin = goals.meta_receita_liquida_centavos > 0
    ? (expectedEbitda / goals.meta_receita_liquida_centavos) * 100
    : 0;

  if (orgLoading) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Centro de comando: metas financeiras e configurações da organização
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Organização</CardTitle>
              </div>
              <CardDescription>Informações da sua agência</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input
                  value={organization?.name || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Para alterar, entre em contato com o suporte
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Acessos Rápidos</CardTitle>
              </div>
              <CardDescription>Navegue para outras configurações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/settings/team" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Gestão de Equipe</p>
                      <p className="text-sm text-muted-foreground">
                        Custo hora dos colaboradores
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Financial Goals - The Core */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Metas Financeiras (Goals)</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Essas metas são usadas para gerar alertas no Dashboard e nos
                      Relatórios quando o realizado estiver fora do planejado.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {hasChanges && (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Alterações não salvas
                </Badge>
              )}
            </div>
            <CardDescription>
              Defina suas metas mensais para acompanhamento de performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Meta Receita Líquida */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <Label htmlFor="meta-receita" className="text-base font-medium">
                      Meta de Receita Líquida Mensal
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receita após deduzir repasses de mídia
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">R$</span>
                  <Input
                    id="meta-receita"
                    type="text"
                    placeholder="100.000,00"
                    value={formatCurrency(goals.meta_receita_liquida_centavos)}
                    onChange={(e) =>
                      handleGoalChange("meta_receita_liquida_centavos", e.target.value)
                    }
                    className="text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Teto Custos Fixos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
                    <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <Label htmlFor="teto-custos" className="text-base font-medium">
                      Teto de Custos Fixos Mensais
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Limite máximo para despesas fixas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">R$</span>
                  <Input
                    id="teto-custos"
                    type="text"
                    placeholder="60.000,00"
                    value={formatCurrency(goals.teto_custos_fixos_centavos)}
                    onChange={(e) =>
                      handleGoalChange("teto_custos_fixos_centavos", e.target.value)
                    }
                    className="text-lg font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* EBITDA Preview */}
            {goals.meta_receita_liquida_centavos > 0 && (
              <>
                <Separator />
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        EBITDA Esperado (Receita - Custos Fixos)
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {formatCurrency(expectedEbitda)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Margem Esperada</p>
                      <p
                        className={`text-2xl font-bold ${
                          expectedMargin >= 20 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {expectedMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {expectedMargin < 20 && (
                    <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Margem abaixo de 20% - considere revisar suas metas
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveGoals}
                disabled={isSaving || !hasChanges}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Metas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories Reference */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Categorias de Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS_RECEITA.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Categorias de Despesa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS_DESPESA.map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
