import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { handleDatabaseError } from "@/lib/errorHandler";

export type TaskStatus = "todo" | "in_progress" | "waiting_approval" | "done" | "late";

export interface Task {
  id: string;
  organization_id: string;
  project_id: string | null;
  assignee_id: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  status: TaskStatus;
  time_spent_minutes: number;
  estimated_time_minutes: number;
  created_at: string;
  updated_at: string;
  // Joined data
  project?: { id: string; name: string } | null;
  assignee?: { id: string; name: string } | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  project_id?: string;
  assignee_id?: string;
  deadline?: string;
  status?: TaskStatus;
  estimated_time_minutes?: number;
}

export function useTasks() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          project:projects(id, name),
          assignee:profiles(id, name)
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          organization_id: organization.id,
          title: input.title,
          description: input.description || null,
          project_id: input.project_id || null,
          assignee_id: input.assignee_id || null,
          deadline: input.deadline || null,
          status: input.status || "todo",
          estimated_time_minutes: input.estimated_time_minutes || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "criar tarefa"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Task> & { id: string }) => {
      // Remove joined data before update
      const { project, assignee, ...updateData } = input as any;
      
      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa atualizada!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "atualizar tarefa"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa removida!");
    },
    onError: (error) => {
      toast.error(handleDatabaseError(error as Error, "remover tarefa"));
    },
  });

  // Filter by status
  const tasksByStatus = {
    todo: query.data?.filter((t) => t.status === "todo") || [],
    in_progress: query.data?.filter((t) => t.status === "in_progress") || [],
    waiting_approval: query.data?.filter((t) => t.status === "waiting_approval") || [],
    done: query.data?.filter((t) => t.status === "done") || [],
    late: query.data?.filter((t) => t.status === "late") || [],
  };

  return {
    tasks: query.data || [],
    tasksByStatus,
    lateCount: tasksByStatus.late.length,
    waitingCount: tasksByStatus.waiting_approval.length,
    isLoading: query.isLoading,
    error: query.error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
