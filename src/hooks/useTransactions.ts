import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";

export type TransactionType = "receita" | "despesa";
export type TransactionStatus = "pago" | "pendente" | "atrasado";

export interface Transaction {
  id: string;
  organization_id: string;
  description: string;
  category: string;
  value_centavos: number;
  type: TransactionType;
  is_repasse: boolean;
  date: string;
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
  is_repasse?: boolean;
  date?: string;
  status?: TransactionStatus;
  project_id?: string;
  notes?: string;
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
      return data as Transaction[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          organization_id: organization.id,
          description: input.description,
          category: input.category,
          value_centavos: input.value_centavos,
          type: input.type,
          is_repasse: input.is_repasse || false,
          date: input.date || new Date().toISOString().split("T")[0],
          status: input.status || "pendente",
          project_id: input.project_id || null,
          notes: input.notes || null,
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
      toast.error(handleDatabaseError(error as Error, "criar transação"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Transaction> & { id: string }) => {
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
      toast.error(handleDatabaseError(error as Error, "atualizar transação"));
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
  // CÁLCULOS FINANCEIROS - COM LÓGICA DE REPASSE
  // ============================================

  const transactions = query.data || [];

  // Transações operacionais (excluindo repasses)
  const receitasOperacionais = transactions.filter(
    (t) => t.type === "receita" && !t.is_repasse
  );
  const despesasOperacionais = transactions.filter(
    (t) => t.type === "despesa" && !t.is_repasse
  );

  // Repasses de mídia (não afetam resultado operacional)
  const repasses = transactions.filter((t) => t.is_repasse);

  // Totais operacionais
  const totalReceitas = receitasOperacionais.reduce(
    (acc, t) => acc + t.value_centavos,
    0
  );
  const totalDespesas = despesasOperacionais.reduce(
    (acc, t) => acc + t.value_centavos,
    0
  );

  // Total de repasses (entrada + saída se houver)
  // Repasses podem ser receita (cliente paga a mídia) ou despesa (agência paga a mídia)
  const repassesReceita = repasses
    .filter((t) => t.type === "receita")
    .reduce((acc, t) => acc + t.value_centavos, 0);
  const repassesDespesa = repasses
    .filter((t) => t.type === "despesa")
    .reduce((acc, t) => acc + t.value_centavos, 0);
  const totalRepasses = Math.max(repassesReceita, repassesDespesa);

  // Saldo previsto (todas as transações operacionais)
  const saldoPrevisto = totalReceitas - totalDespesas;

  // Saldo realizado (apenas transações pagas)
  const receitasRealizadas = receitasOperacionais
    .filter((t) => t.status === "pago")
    .reduce((acc, t) => acc + t.value_centavos, 0);
  const despesasRealizadas = despesasOperacionais
    .filter((t) => t.status === "pago")
    .reduce((acc, t) => acc + t.value_centavos, 0);
  const saldoRealizado = receitasRealizadas - despesasRealizadas;

  // Fluxo de caixa total (inclui repasses para visão completa do caixa)
  const totalReceitasCaixa = transactions
    .filter((t) => t.type === "receita")
    .reduce((acc, t) => acc + t.value_centavos, 0);
  const totalDespesasCaixa = transactions
    .filter((t) => t.type === "despesa")
    .reduce((acc, t) => acc + t.value_centavos, 0);
  const fluxoCaixa = totalReceitasCaixa - totalDespesasCaixa;

  return {
    transactions,
    receitas: receitasOperacionais,
    despesas: despesasOperacionais,
    repasses,
    totalReceitas,
    totalDespesas,
    totalRepasses,
    saldoPrevisto,
    saldoRealizado,
    fluxoCaixa,
    isLoading: query.isLoading,
    error: query.error,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
