import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";

export type DealStage = "prospecting" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export interface Deal {
  id: string;
  organization_id: string;
  company: string;
  contact: string | null;
  value_centavos: number;
  probability: number;
  stage: DealStage;
  days_in_stage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDealInput {
  company: string;
  contact?: string;
  value_centavos?: number;
  probability?: number;
  stage?: DealStage;
  notes?: string;
}

export function useDeals() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["deals", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateDealInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("deals")
        .insert({
          organization_id: organization.id,
          company: input.company,
          contact: input.contact || null,
          value_centavos: input.value_centavos || 0,
          probability: input.probability || 20,
          stage: input.stage || "prospecting",
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Negócio criado com sucesso!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "criar negócio"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from("deals")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Negócio atualizado!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "atualizar negócio"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Negócio removido!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "remover negócio"));
    },
  });

  // Group deals by stage for kanban view
  const dealsByStage = {
    prospecting: query.data?.filter((d) => d.stage === "prospecting") || [],
    proposal: query.data?.filter((d) => d.stage === "proposal") || [],
    negotiation: query.data?.filter((d) => d.stage === "negotiation") || [],
    closed_won: query.data?.filter((d) => d.stage === "closed_won") || [],
    closed_lost: query.data?.filter((d) => d.stage === "closed_lost") || [],
  };

  return {
    deals: query.data || [],
    dealsByStage,
    isLoading: query.isLoading,
    error: query.error,
    createDeal: createMutation.mutate,
    updateDeal: updateMutation.mutate,
    deleteDeal: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
