import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";
import { parseInput, ClientSchema } from "@/lib/validation";

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  fee_mensal_centavos: number | null;
  contrato_inicio: string | null;
  contrato_fim: string | null;
  created_at: string;
}

export interface CreateClientInput {
  name: string;
  fee_mensal_centavos?: number;
  contrato_inicio?: string;
  contrato_fim?: string;
}

export function useClients() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clients", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateClientInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      // Validate input before sending to database
      const validatedData = parseInput(ClientSchema, input);

      const { data, error } = await supabase
        .from("clients")
        .insert({
          organization_id: organization.id,
          name: validatedData.name,
          fee_mensal_centavos: validatedData.fee_mensal_centavos || 0,
          contrato_inicio: validatedData.contrato_inicio || null,
          contrato_fim: validatedData.contrato_fim || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "criar cliente"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Client> & { id: string }) => {
      // Validate name if present
      if (input.name !== undefined && input.name.length === 0) {
        throw new Error('Nome é obrigatório');
      }
      if (input.name !== undefined && input.name.length > 255) {
        throw new Error('Nome deve ter no máximo 255 caracteres');
      }

      const { data, error } = await supabase
        .from("clients")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente atualizado!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "atualizar cliente"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente removido!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "remover cliente"));
    },
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    deleteClient: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
