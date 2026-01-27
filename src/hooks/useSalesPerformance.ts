import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface SalesPerformance {
  salesperson_id: string;
  salesperson_name: string;
  deals_closed: number;
  revenue_centavos: number;
  average_ticket_centavos: number;
  commission_earned_centavos: number;
}

export function useSalesPerformance(month?: string) {
  const { organization } = useOrganization();
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  return useQuery({
    queryKey: ["sales-performance", organization?.id, currentMonth],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Get all team members
      const { data: members, error: membersError } = await supabase
        .from("profiles")
        .select("id, name, comissao_percentual")
        .eq("organization_id", organization.id);

      if (membersError) throw membersError;

      // Get closed deals for the month
      const startDate = `${currentMonth}-01`;
      const endDate = new Date(
        parseInt(currentMonth.slice(0, 4)),
        parseInt(currentMonth.slice(5, 7)),
        0
      )
        .toISOString()
        .slice(0, 10);

      const { data: deals, error: dealsError } = await supabase
        .from("deals")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("stage", "closed_won")
        .gte("updated_at", startDate)
        .lte("updated_at", endDate + "T23:59:59");

      if (dealsError) throw dealsError;

      // Get commission transactions for the month
      const { data: commissions, error: commissionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("category", "Comissões de Vendas")
        .gte("date", startDate)
        .lte("date", endDate);

      if (commissionsError) throw commissionsError;

      // Aggregate performance by salesperson
      const performanceMap = new Map<string, SalesPerformance>();

      (members || []).forEach((member) => {
        performanceMap.set(member.id, {
          salesperson_id: member.id,
          salesperson_name: member.name,
          deals_closed: 0,
          revenue_centavos: 0,
          average_ticket_centavos: 0,
          commission_earned_centavos: 0,
        });
      });

      // Count deals by salesperson
      (deals || []).forEach((deal) => {
        const salespersonId = deal.salesperson_id;
        if (salespersonId && performanceMap.has(salespersonId)) {
          const perf = performanceMap.get(salespersonId)!;
          perf.deals_closed += 1;
          perf.revenue_centavos += deal.value_centavos;
        }
      });

      // Add commission data
      (commissions || []).forEach((commission) => {
        const salespersonId = commission.salesperson_id;
        if (salespersonId && performanceMap.has(salespersonId)) {
          const perf = performanceMap.get(salespersonId)!;
          perf.commission_earned_centavos += commission.value_centavos;
        }
      });

      // Calculate averages and convert to array
      const result = Array.from(performanceMap.values())
        .map((perf) => ({
          ...perf,
          average_ticket_centavos:
            perf.deals_closed > 0
              ? Math.round(perf.revenue_centavos / perf.deals_closed)
              : 0,
        }))
        .filter((perf) => perf.deals_closed > 0 || perf.revenue_centavos > 0)
        .sort((a, b) => b.revenue_centavos - a.revenue_centavos);

      return result;
    },
    enabled: !!organization?.id,
  });
}
