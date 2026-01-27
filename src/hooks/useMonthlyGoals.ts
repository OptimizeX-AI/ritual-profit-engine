import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";

export type GoalType = "faturamento" | "leads" | "vendas_qtd";

export interface MonthlyGoal {
  id: string;
  organization_id: string;
  month: string; // YYYY-MM
  type: GoalType;
  target_value_centavos: number;
  achieved_value_centavos: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  month: string;
  type: GoalType;
  target_value_centavos: number;
  achieved_value_centavos?: number;
}

export function useMonthlyGoals(month?: string) {
  const { organization, isAdmin } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["monthly-goals", organization?.id, month],
    queryFn: async () => {
      if (!organization?.id) return [];

      let queryBuilder = supabase
        .from("monthly_goals")
        .select("*")
        .eq("organization_id", organization.id)
        .order("month", { ascending: false });

      if (month) {
        queryBuilder = queryBuilder.eq("month", month);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data as MonthlyGoal[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("monthly_goals")
        .insert({
          organization_id: organization.id,
          month: input.month,
          type: input.type,
          target_value_centavos: input.target_value_centavos,
          achieved_value_centavos: input.achieved_value_centavos || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-goals"] });
      toast.success("Meta criada com sucesso!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "criar meta"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<MonthlyGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from("monthly_goals")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-goals"] });
      toast.success("Meta atualizada!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "atualizar meta"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("monthly_goals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-goals"] });
      toast.success("Meta removida!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "remover meta"));
    },
  });

  // Get current month goals
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthGoals = (query.data || []).filter(
    (g) => g.month === currentMonth
  );

  const faturamentoGoal = currentMonthGoals.find(
    (g) => g.type === "faturamento"
  );
  const leadsGoal = currentMonthGoals.find((g) => g.type === "leads");
  const vendasGoal = currentMonthGoals.find((g) => g.type === "vendas_qtd");

  return {
    goals: query.data || [],
    currentMonthGoals,
    faturamentoGoal,
    leadsGoal,
    vendasGoal,
    isLoading: query.isLoading,
    error: query.error,
    createGoal: createMutation.mutate,
    updateGoal: updateMutation.mutate,
    deleteGoal: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    canManage: isAdmin,
  };
}
