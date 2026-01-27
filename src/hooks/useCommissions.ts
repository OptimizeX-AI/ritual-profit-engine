import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

interface CreateCommissionInput {
  dealId: string;
  dealValue: number;
  salespersonId: string;
  projectId?: string;
}

export function useCommissions() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const createCommissionMutation = useMutation({
    mutationFn: async (input: CreateCommissionInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      // 1. Buscar dados do vendedor
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, comissao_percentual, tipo_comissao")
        .eq("id", input.salespersonId)
        .single();

      if (profileError) throw profileError;

      const comissaoPercent = profile?.comissao_percentual || 0;
      if (comissaoPercent === 0) {
        return null; // Sem comissão configurada
      }

      // 2. Calcular valor da comissão
      const valorComissao = Math.round(input.dealValue * (comissaoPercent / 100));

      // 3. Criar transação de despesa provisionada
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          organization_id: organization.id,
          description: `Comissão de Vendas - ${profile?.name || "Vendedor"}`,
          category: "Comissões de Vendas",
          value_centavos: valorComissao,
          type: "despesa",
          nature: "operacional",
          cost_type: "direto",
          is_repasse: false,
          date: new Date().toISOString().split("T")[0],
          competence_date: new Date().toISOString().split("T")[0],
          status: "pendente",
          project_id: input.projectId || null,
          salesperson_id: input.salespersonId,
          notes: `Comissão de ${comissaoPercent}% sobre negócio fechado`,
        })
        .select()
        .single();

      if (txError) throw txError;
      return transaction;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        toast.success("Comissão provisionada automaticamente!");
      }
    },
    onError: (error) => {
      console.error("Erro ao criar comissão:", error);
      toast.error("Erro ao provisionar comissão");
    },
  });

  const updateProfileCommission = useMutation({
    mutationFn: async (input: {
      profileId: string;
      comissao_percentual: number;
      tipo_comissao: "sobre_faturamento" | "sobre_margem";
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          comissao_percentual: input.comissao_percentual,
          tipo_comissao: input.tipo_comissao,
        })
        .eq("id", input.profileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Comissão atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar comissão");
    },
  });

  return {
    createCommission: createCommissionMutation.mutateAsync,
    updateProfileCommission: updateProfileCommission.mutate,
    isCreating: createCommissionMutation.isPending,
    isUpdating: updateProfileCommission.isPending,
  };
}
