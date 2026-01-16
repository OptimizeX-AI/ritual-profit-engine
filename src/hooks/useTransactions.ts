import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";
import {
  TransactionSchema,
  prepareTransactionForInsert,
  validateRepasse,
  calcularTotaisOperacionais,
  calcularTotaisRepasses,
  calcularFluxoCaixa,
  calcularSaldoRealizado,
  calcularCustosPorTipo,
  type TransactionType,
  type TransactionStatus,
  type TransactionNature,
  type CostType,
} from "@/lib/financialValidation";

export type { TransactionType, TransactionStatus, TransactionNature, CostType };

export interface Transaction {
  id: string;
  organization_id: string;
  description: string;
  category: string;
  value_centavos: number;
  type: TransactionType;
  nature: TransactionNature;
  cost_type: CostType;
  is_repasse: boolean;
  date: string;
  competence_date: string | null;
  payment_date: string | null;
  status: TransactionStatus;
  project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  description: string;
  category: string;
  value_centavos: number;
  type: TransactionType;
  nature?: TransactionNature;
  cost_type?: CostType;
  is_repasse?: boolean;
  date?: string;
  competence_date?: string | null;
  payment_date?: string | null;
  status?: TransactionStatus;
  project_id?: string | null;
  notes?: string | null;
}

export function useTransactions() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("organization_id", organization.id)
        .order("date", { ascending: false });

      if (error) throw error;
      
      // Mapeia para garantir tipos corretos e defaults
      return (data || []).map(t => ({
        ...t,
        nature: (t.nature || 'operacional') as TransactionNature,
        cost_type: (t.cost_type || 'fixo') as CostType,
        type: t.type as TransactionType,
        status: t.status as TransactionStatus,
      })) as Transaction[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      // Validação com schema
      const validated = TransactionSchema.parse({
        description: input.description,
        category: input.category,
        value_centavos: input.value_centavos,
        type: input.type,
        nature: input.nature || 'operacional',
        cost_type: input.cost_type || (input.project_id ? 'direto' : 'fixo'),
        is_repasse: input.is_repasse || false,
        date: input.date || new Date().toISOString().split("T")[0],
        competence_date: input.competence_date || input.date || new Date().toISOString().split("T")[0],
        payment_date: input.payment_date || null,
        status: input.status || "pendente",
        project_id: input.project_id || null,
        notes: input.notes || null,
      });

      // Prepara com regras de negócio
      const prepared = prepareTransactionForInsert(validated);

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          organization_id: organization.id,
          description: prepared.description,
          category: prepared.category,
          value_centavos: prepared.value_centavos,
          type: prepared.type,
          nature: prepared.nature,
          cost_type: prepared.cost_type,
          is_repasse: prepared.is_repasse,
          date: prepared.date,
          competence_date: prepared.competence_date,
          payment_date: prepared.payment_date,
          status: prepared.status,
          project_id: prepared.project_id,
          notes: prepared.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação criada com sucesso!");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao criar transação";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Transaction> & { id: string }) => {
      // Se estamos atualizando is_repasse, valida as regras
      if (input.is_repasse !== undefined && input.category) {
        const validation = validateRepasse(
          input.is_repasse,
          input.category,
          input.type || 'despesa'
        );
        
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Força natureza se for repasse
        if (validation.correctedNature) {
          input.nature = validation.correctedNature;
        }
      }

      // Se tem project_id, força cost_type = direto
      if (input.project_id) {
        input.cost_type = 'direto';
      } else if (input.project_id === null) {
        input.cost_type = 'fixo';
      }

      // Se status mudou para 'pago' e não tem payment_date, adiciona
      if (input.status === 'pago' && !input.payment_date) {
        input.payment_date = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from("transactions")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação atualizada!");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao atualizar transação";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação removida!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "remover transação"));
    },
  });

  // ============================================
  // CÁLCULOS FINANCEIROS - COM LÓGICA BLINDADA
  // ============================================

  const transactions = query.data || [];

  // Usa as funções de cálculo do módulo de validação
  const totaisOperacionais = calcularTotaisOperacionais(transactions);
  const totaisRepasses = calcularTotaisRepasses(transactions);
  const fluxoCaixaCalc = calcularFluxoCaixa(transactions);
  const saldoRealizadoCalc = calcularSaldoRealizado(transactions);
  const custosPorTipo = calcularCustosPorTipo(transactions);

  // Transações filtradas por tipo (para compatibilidade)
  const receitasOperacionais = transactions.filter(
    (t) => t.type === "receita" && !t.is_repasse && t.nature === 'operacional'
  );
  const despesasOperacionais = transactions.filter(
    (t) => t.type === "despesa" && !t.is_repasse && t.nature === 'operacional'
  );
  const repasses = transactions.filter((t) => t.is_repasse);

  // Contas a pagar/receber (pendentes)
  const contasReceber = transactions.filter(
    (t) => t.type === "receita" && t.status === "pendente" && !t.is_repasse
  );
  const contasPagar = transactions.filter(
    (t) => t.type === "despesa" && t.status === "pendente" && !t.is_repasse
  );

  return {
    // Dados brutos
    transactions,
    receitas: receitasOperacionais,
    despesas: despesasOperacionais,
    repasses,
    contasReceber,
    contasPagar,

    // Totais operacionais (excluindo repasses)
    totalReceitas: totaisOperacionais.receitas,
    totalDespesas: totaisOperacionais.despesas,
    resultadoOperacional: totaisOperacionais.resultado,

    // Repasses (apenas fluxo de caixa)
    totalRepasses: Math.max(totaisRepasses.entrada, totaisRepasses.saida),
    repassesEntrada: totaisRepasses.entrada,
    repassesSaida: totaisRepasses.saida,
    saldoRepasses: totaisRepasses.saldo,

    // Fluxo de caixa
    fluxoCaixaOperacional: fluxoCaixaCalc.operacional,
    fluxoCaixaRepasses: fluxoCaixaCalc.repasses,
    fluxoCaixa: fluxoCaixaCalc.total,

    // Realizado vs Previsto
    saldoPrevisto: totaisOperacionais.resultado,
    saldoRealizado: saldoRealizadoCalc.resultado,

    // Custos por tipo
    custosDiretos: custosPorTipo.diretos,
    custosFixos: custosPorTipo.fixos,
    custosTotal: custosPorTipo.total,

    // Estado
    isLoading: query.isLoading,
    error: query.error,

    // Mutações
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
