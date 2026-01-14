import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";
import { parseInput, ProjectSchema } from "@/lib/validation";

export interface Project {
  id: string;
  client_id: string;
  name: string;
  horas_contratadas: number | null;
  created_at: string;
}

export interface CreateProjectInput {
  client_id: string;
  name: string;
  horas_contratadas?: number;
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
            organization_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Project & { clients: { organization_id: string } })[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      // Validate input before sending to database
      const validatedData = parseInput(ProjectSchema, input);

      const { data, error } = await supabase
        .from("projects")
        .insert({
          client_id: validatedData.client_id,
          name: validatedData.name,
          horas_contratadas: validatedData.horas_contratadas || 0,
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
