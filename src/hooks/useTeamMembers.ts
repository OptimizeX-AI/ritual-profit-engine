import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  organization_id: string | null;
  name: string;
  custo_hora_centavos: number | null;
  created_at: string;
}

export function useTeamMembers() {
  const { organization, isAdmin } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["team-members", organization?.id, isAdmin],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Fetch profiles in the organization
      // If admin, include custo_hora_centavos; otherwise use the public view
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // If not admin, hide custo_hora_centavos
      if (!isAdmin) {
        return data.map((member) => ({
          ...member,
          custo_hora_centavos: null,
        })) as TeamMember[];
      }

      return data as TeamMember[];
    },
    enabled: !!organization?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Membro atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar membro: " + error.message);
    },
  });

  return {
    members: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    updateMember: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
