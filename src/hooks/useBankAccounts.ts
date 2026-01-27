import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface BankAccount {
  id: string;
  organization_id: string;
  name: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  saldo_inicial_centavos: number;
  saldo_atual_centavos: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountInput {
  name: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  saldo_inicial_centavos?: number;
  is_default?: boolean;
}

export function useBankAccounts() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bank-accounts", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("organization_id", organization.id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateBankAccountInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("bank_accounts")
        .insert({
          organization_id: organization.id,
          name: input.name,
          banco: input.banco || null,
          agencia: input.agencia || null,
          conta: input.conta || null,
          saldo_inicial_centavos: input.saldo_inicial_centavos || 0,
          saldo_atual_centavos: input.saldo_inicial_centavos || 0,
          is_default: input.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta bancária criada!");
    },
    onError: () => {
      toast.error("Erro ao criar conta bancária");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: Partial<BankAccount> & { id: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("bank_accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar conta");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta removida!");
    },
    onError: () => {
      toast.error("Erro ao remover conta");
    },
  });

  // Saldo consolidado
  const saldoConsolidado = (query.data || []).reduce(
    (sum, acc) => sum + acc.saldo_atual_centavos,
    0
  );

  return {
    accounts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    saldoConsolidado,
    createAccount: createMutation.mutate,
    updateAccount: updateMutation.mutate,
    deleteAccount: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
