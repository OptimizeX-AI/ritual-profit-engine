import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface TeamMemberWorkload {
  id: string;
  name: string;
  weeklyCapacityHours: number;
  allocatedHours: number;
  utilizationPercent: number;
  status: "healthy" | "attention" | "overloaded";
  tasks: {
    id: string;
    title: string;
    estimatedMinutes: number;
    deadline: string | null;
    projectName: string | null;
  }[];
}

export function useWorkloadCapacity() {
  const { organization } = useOrganization();

  const query = useQuery({
    queryKey: ["workload-capacity", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Fetch team members with their capacity
      const { data: members, error: membersError } = await supabase
        .from("profiles")
        .select("id, name, weekly_capacity_hours")
        .eq("organization_id", organization.id);

      if (membersError) throw membersError;

      // Fetch active tasks (todo, in_progress) with their assignments
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          estimated_time_minutes,
          deadline,
          assignee_id,
          status,
          project:projects(id, name)
        `)
        .eq("organization_id", organization.id)
        .in("status", ["todo", "in_progress"]);

      if (tasksError) throw tasksError;

      // Calculate workload for each member
      const workloadData: TeamMemberWorkload[] = members.map((member) => {
        const memberTasks = tasks.filter((t) => t.assignee_id === member.id);
        const allocatedMinutes = memberTasks.reduce(
          (sum, t) => sum + (t.estimated_time_minutes || 0),
          0
        );
        const allocatedHours = allocatedMinutes / 60;
        const weeklyCapacity = member.weekly_capacity_hours || 40;
        const utilizationPercent = (allocatedHours / weeklyCapacity) * 100;

        let status: "healthy" | "attention" | "overloaded" = "healthy";
        if (utilizationPercent > 100) {
          status = "overloaded";
        } else if (utilizationPercent >= 80) {
          status = "attention";
        }

        return {
          id: member.id,
          name: member.name,
          weeklyCapacityHours: weeklyCapacity,
          allocatedHours: Math.round(allocatedHours * 10) / 10,
          utilizationPercent: Math.round(utilizationPercent),
          status,
          tasks: memberTasks.map((t) => ({
            id: t.id,
            title: t.title,
            estimatedMinutes: t.estimated_time_minutes || 0,
            deadline: t.deadline,
            projectName: t.project?.name || null,
          })),
        };
      });

      // Sort by utilization (highest first)
      return workloadData.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
    },
    enabled: !!organization?.id,
  });

  const overloadedCount = query.data?.filter((m) => m.status === "overloaded").length || 0;
  const attentionCount = query.data?.filter((m) => m.status === "attention").length || 0;

  return {
    workloadData: query.data || [],
    overloadedCount,
    attentionCount,
    isLoading: query.isLoading,
    error: query.error,
  };
}
