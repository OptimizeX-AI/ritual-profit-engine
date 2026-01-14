import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  lateTasks: number;
  totalMinutes: number;
  estimatedMinutes: number;
}

export function useProjectStats() {
  const { organization } = useOrganization();

  const query = useQuery({
    queryKey: ["project-stats", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return {};

      // Fetch all tasks with their project_id
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("id, project_id, status, time_spent_minutes, estimated_time_minutes, deadline")
        .eq("organization_id", organization.id);

      if (error) throw error;

      // Calculate stats per project
      const statsMap: Record<string, ProjectStats> = {};

      for (const task of tasks || []) {
        if (!task.project_id) continue;

        if (!statsMap[task.project_id]) {
          statsMap[task.project_id] = {
            totalTasks: 0,
            completedTasks: 0,
            lateTasks: 0,
            totalMinutes: 0,
            estimatedMinutes: 0,
          };
        }

        const stats = statsMap[task.project_id];
        stats.totalTasks++;
        stats.totalMinutes += task.time_spent_minutes || 0;
        stats.estimatedMinutes += task.estimated_time_minutes || 0;

        if (task.status === "done") {
          stats.completedTasks++;
        }

        // Check if late (deadline passed and not done/waiting_approval)
        if (
          task.deadline &&
          task.status !== "done" &&
          task.status !== "waiting_approval"
        ) {
          const deadline = new Date(task.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          deadline.setHours(0, 0, 0, 0);
          
          if (deadline < today) {
            stats.lateTasks++;
          }
        }
      }

      return statsMap;
    },
    enabled: !!organization?.id,
  });

  return {
    projectStats: query.data || {},
    isLoading: query.isLoading,
    error: query.error,
  };
}
