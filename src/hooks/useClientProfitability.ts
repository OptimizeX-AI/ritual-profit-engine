import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface ClientProfitabilityData {
  clientId: string;
  clientName: string;
  revenue: number; // centavos
  laborCost: number; // centavos
  directCosts: number; // centavos
  profit: number; // centavos
  margin: number; // percentage
}

export function useClientProfitability() {
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["client-profitability", organization?.id],
    queryFn: async (): Promise<ClientProfitabilityData[]> => {
      if (!organization?.id) return [];

      // 1. Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, name")
        .eq("organization_id", organization.id);

      if (clientsError) throw clientsError;
      if (!clients || clients.length === 0) return [];

      // 2. Fetch projects (to link transactions and tasks to clients)
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, client_id, name");

      if (projectsError) throw projectsError;

      // 3. Fetch transactions (only operational, no repasses)
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("id, project_id, type, value_centavos, is_repasse")
        .eq("organization_id", organization.id)
        .eq("is_repasse", false);

      if (transactionsError) throw transactionsError;

      // 4. Fetch tasks with time spent
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, project_id, assignee_id, time_spent_minutes")
        .eq("organization_id", organization.id);

      if (tasksError) throw tasksError;

      // 5. Fetch profiles with custo_hora (only if user is admin, otherwise will be null)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, custo_hora_centavos")
        .eq("organization_id", organization.id);

      if (profilesError) throw profilesError;

      // Create lookup maps
      const projectToClient = new Map<string, string>();
      (projects || []).forEach((p) => {
        projectToClient.set(p.id, p.client_id);
      });

      const profileCostMap = new Map<string, number>();
      (profiles || []).forEach((p) => {
        profileCostMap.set(p.id, p.custo_hora_centavos || 0);
      });

      // Calculate per client
      const clientProfitability: ClientProfitabilityData[] = clients.map((client) => {
        // Get projects for this client
        const clientProjectIds = (projects || [])
          .filter((p) => p.client_id === client.id)
          .map((p) => p.id);

        // Revenue: income transactions linked to client's projects
        const revenue = (transactions || [])
          .filter((t) => t.type === "receita" && t.project_id && clientProjectIds.includes(t.project_id))
          .reduce((sum, t) => sum + t.value_centavos, 0);

        // Direct Costs: expense transactions linked to client's projects
        const directCosts = (transactions || [])
          .filter((t) => t.type === "despesa" && t.project_id && clientProjectIds.includes(t.project_id))
          .reduce((sum, t) => sum + t.value_centavos, 0);

        // Labor Cost: hours worked * hourly cost
        const laborCost = (tasks || [])
          .filter((t) => t.project_id && clientProjectIds.includes(t.project_id))
          .reduce((sum, task) => {
            const hoursWorked = task.time_spent_minutes / 60;
            const hourlyRate = task.assignee_id ? profileCostMap.get(task.assignee_id) || 0 : 0;
            return sum + hoursWorked * hourlyRate;
          }, 0);

        // Profit = Revenue - Direct Costs - Labor Cost
        const profit = revenue - directCosts - laborCost;

        // Margin = (Profit / Revenue) * 100
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          clientId: client.id,
          clientName: client.name,
          revenue,
          laborCost: Math.round(laborCost),
          directCosts,
          profit: Math.round(profit),
          margin: Math.round(margin * 100) / 100, // 2 decimal places
        };
      });

      // Sort by profit descending
      return clientProfitability.sort((a, b) => b.profit - a.profit);
    },
    enabled: !!organization?.id,
  });
}
