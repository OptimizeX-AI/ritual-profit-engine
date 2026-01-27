import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

/**
 * Lightweight hook to fetch only pipeline KPI value
 * Use this on Dashboard/Index instead of full useCRMKanban
 */
export function usePipelineKPI() {
  const { organization } = useOrganization();

  const query = useQuery({
    queryKey: ["pipeline-kpi", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { pipelineValue: 0 };

      const { data, error } = await supabase
        .from("deals")
        .select("value_centavos, probability, stage")
        .eq("organization_id", organization.id)
        .not("stage", "in", "(closed_won,closed_lost)");

      if (error) throw error;

      // Calculate weighted pipeline
      const pipelineValue = (data || []).reduce(
        (acc, d) => acc + d.value_centavos * (d.probability / 100),
        0
      );

      return { pipelineValue };
    },
    enabled: !!organization?.id,
  });

  return {
    pipelineValue: query.data?.pipelineValue || 0,
    isLoading: query.isLoading,
  };
}
