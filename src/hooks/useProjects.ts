import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";
import { parseInput, ProjectSchema } from "@/lib/validation";

export type ScopeType = "horas_fechadas" | "fee_mensal" | "pontual";

export interface Project {
  id: string;
  client_id: string;
  name: string;
  horas_contratadas: number | null;
  scope_type: ScopeType;
  initial_budget_hours: number;
  current_budget_hours: number;
  created_at: string;
  clients?: {
    organization_id: string;
    name: string;
  };
}

export interface CreateProjectInput {
  client_id: string;
  name: string;
  horas_contratadas?: number;
  scope_type?: ScopeType;
  initial_budget_hours?: number;
  current_budget_hours?: number;
}

export function useProjects() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projects", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Fetch projects through clients (multi-tenant via RLS)
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients!inner (
            organization_id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      // Validate input before sending to database
      const validatedData = parseInput(ProjectSchema, input);

      const initialBudget = input.initial_budget_hours || input.horas_contratadas || 0;

      const { data, error } = await supabase
        .from("projects")
        .insert({
          client_id: validatedData.client_id,
          name: validatedData.name,
          horas_contratadas: validatedData.horas_contratadas || 0,
          scope_type: input.scope_type || "fee_mensal",
          initial_budget_hours: initialBudget,
          current_budget_hours: initialBudget,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "criar projeto"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Project> & { id: string }) => {
      // Validate name if present
      if (input.name !== undefined && input.name.length === 0) {
        throw new Error('Nome é obrigatório');
      }
      if (input.name !== undefined && input.name.length > 255) {
        throw new Error('Nome deve ter no máximo 255 caracteres');
      }

      const { data, error } = await supabase
        .from("projects")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto atualizado!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "atualizar projeto"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto removido!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "remover projeto"));
    },
  });

  return {
    projects: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    deleteProject: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook for single project with detailed data
export function useProjectDetail(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-detail", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients (
            id,
            name,
            fee_mensal_centavos,
            organization_id
          )
        `)
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}
