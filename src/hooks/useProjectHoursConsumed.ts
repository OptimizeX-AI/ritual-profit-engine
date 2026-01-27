import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to calculate hours consumed by a project based on tasks
 */
export function useProjectHoursConsumed(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-hours-consumed", projectId],
    queryFn: async () => {
      if (!projectId) return { estimatedHours: 0, workedHours: 0 };

      const { data, error } = await supabase
        .from("tasks")
        .select("estimated_time_minutes, time_spent_minutes")
        .eq("project_id", projectId);

      if (error) throw error;

      const estimatedMinutes = (data || []).reduce((sum, t) => sum + (t.estimated_time_minutes || 0), 0);
      const workedMinutes = (data || []).reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0);

      return {
        estimatedHours: estimatedMinutes / 60,
        workedHours: workedMinutes / 60,
      };
    },
    enabled: !!projectId,
  });
}
