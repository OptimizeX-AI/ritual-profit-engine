import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface ProjectAddendum {
  id: string;
  project_id: string;
  description: string;
  hours_added: number;
  cost_added_centavos: number;
  approved_by_client: boolean;
  created_by: string | null;
  created_at: string;
}

export interface CreateAddendumInput {
  project_id: string;
  description: string;
  hours_added: number;
  cost_added_centavos?: number;
  approved_by_client?: boolean;
}

export function useProjectAddendums(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["project-addendums", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_addendums")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectAddendum[];
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateAddendumInput) => {
      if (!input.description.trim()) {
        throw new Error("Descrição é obrigatória");
      }

      const { data, error } = await supabase
        .from("project_addendums")
        .insert({
          project_id: input.project_id,
          description: input.description,
          hours_added: input.hours_added,
          cost_added_centavos: input.cost_added_centavos || 0,
          approved_by_client: input.approved_by_client || false,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-addendums", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Aditivo criado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar aditivo: ${(error as Error).message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ProjectAddendum> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_addendums")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-addendums", projectId] });
      toast.success("Aditivo atualizado!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar aditivo: ${(error as Error).message}`);
    },
  });

  const totalAddedHours = (query.data || []).reduce((sum, a) => sum + a.hours_added, 0);
  const totalAddedCost = (query.data || []).reduce((sum, a) => sum + a.cost_added_centavos, 0);

  return {
    addendums: query.data || [],
    isLoading: query.isLoading,
    totalAddedHours,
    totalAddedCost,
    createAddendum: createMutation.mutate,
    updateAddendum: updateMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
