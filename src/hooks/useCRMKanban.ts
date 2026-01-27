import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

// Stages mapping for CRM Kanban
export const CRM_STAGES = [
  { id: "prospecting", label: "Prospecção", probability: 10 },
  { id: "proposal", label: "Proposta", probability: 40 },
  { id: "negotiation", label: "Negociação", probability: 70 },
  { id: "closed_won", label: "Fechado ✓", probability: 100 },
] as const;

export type CRMStageId = (typeof CRM_STAGES)[number]["id"];

export interface CRMDeal {
  id: string;
  organization_id: string;
  company: string;
  contact: string | null;
  value_centavos: number;
  probability: number;
  stage: CRMStageId;
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
  stage?: CRMStageId;
  notes?: string;
}

export function useCRMKanban() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["crm-deals", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CRMDeal[];
    },
    enabled: !!organization?.id,
  });

  // Update stage mutation with optimistic update
  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: CRMStageId }) => {
      const { data, error } = await supabase
        .from("deals")
        .update({ stage, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, stage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["crm-deals"] });

      // Snapshot current data
      const previousDeals = queryClient.getQueryData<CRMDeal[]>(["crm-deals", organization?.id]);

      // Optimistically update
      queryClient.setQueryData<CRMDeal[]>(["crm-deals", organization?.id], (old) =>
        old?.map((deal) => (deal.id === id ? { ...deal, stage } : deal))
      );

      return { previousDeals };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousDeals) {
        queryClient.setQueryData(["crm-deals", organization?.id], context.previousDeals);
      }
      toast.error("Erro ao mover negócio");
    },
    onSuccess: () => {
      toast.success("Negócio atualizado!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
    },
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
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      toast.success("Negócio criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar negócio");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      toast.success("Negócio removido!");
    },
    onError: () => {
      toast.error("Erro ao remover negócio");
    },
  });

  // Organize deals by stage
  const dealsByStage: Record<CRMStageId, CRMDeal[]> = {
    prospecting: [],
    proposal: [],
    negotiation: [],
    closed_won: [],
  };

  (query.data || []).forEach((deal) => {
    if (dealsByStage[deal.stage]) {
      dealsByStage[deal.stage].push(deal);
    } else {
      // Handle legacy stages (e.g., closed_lost)
      dealsByStage.prospecting.push(deal);
    }
  });

  // Calculate weighted pipeline (excluding closed deals)
  const pipelineValue = (query.data || [])
    .filter((d) => d.stage !== "closed_won")
    .reduce((acc, d) => acc + d.value_centavos * (d.probability / 100), 0);

  // Total pipeline value (all non-closed)
  const totalPipeline = (query.data || [])
    .filter((d) => d.stage !== "closed_won")
    .reduce((acc, d) => acc + d.value_centavos, 0);

  // Closed won value
  const closedWonValue = (query.data || [])
    .filter((d) => d.stage === "closed_won")
    .reduce((acc, d) => acc + d.value_centavos, 0);

  return {
    deals: query.data || [],
    dealsByStage,
    isLoading: query.isLoading,
    error: query.error,

    // KPIs
    pipelineValue,
    totalPipeline,
    closedWonValue,

    // Mutations
    updateStage: updateStageMutation.mutate,
    createDeal: createMutation.mutate,
    deleteDeal: deleteMutation.mutate,
    isUpdating: updateStageMutation.isPending,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
