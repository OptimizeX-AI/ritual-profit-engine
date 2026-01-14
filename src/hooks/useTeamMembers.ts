import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";
import { parseInput, TeamMemberUpdateSchema } from "@/lib/validation";

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

      // SECURITY FIX: Use different data sources based on role
      // Admins query the full profiles table (includes custo_hora_centavos)
      // Non-admins query profiles_public view (excludes custo_hora_centavos)
      if (isAdmin) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as TeamMember[];
      } else {
        // Use the public view that excludes sensitive salary data
        const { data, error } = await supabase
          .from("profiles_public")
          .select("*")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Map to TeamMember type with null custo_hora_centavos
        return (data || []).map((member) => ({
          id: member.id!,
          organization_id: member.organization_id,
          name: member.name || '',
          custo_hora_centavos: null,
          created_at: member.created_at || '',
        })) as TeamMember[];
      }
    },
    enabled: !!organization?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: Partial<TeamMember> & { id: string }) => {
      // Validate input before sending to database
      const validatedData = parseInput(TeamMemberUpdateSchema, input);
      const { id, ...updateData } = validatedData;
      
      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
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
      toast.error(handleDatabaseError(error as Error, "atualizar membro"));
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
