import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { differenceInDays, addDays, parseISO } from "date-fns";

export interface ChurnRisk {
  client_id: string;
  client_name: string;
  contract_end: string;
  days_until_end: number;
  fee_mensal_centavos: number;
  risk_level: "critical" | "high" | "medium";
}

export function useChurnRadar(daysAhead: number = 60) {
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["churn-radar", organization?.id, daysAhead],
    queryFn: async () => {
      if (!organization?.id) return [];

      const today = new Date();
      const futureDate = addDays(today, daysAhead);

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", organization.id)
        .not("contrato_fim", "is", null)
        .lte("contrato_fim", futureDate.toISOString().slice(0, 10))
        .order("contrato_fim", { ascending: true });

      if (error) throw error;

      const result: ChurnRisk[] = (data || [])
        .map((client) => {
          const contractEnd = parseISO(client.contrato_fim!);
          const daysUntilEnd = differenceInDays(contractEnd, today);

          let riskLevel: "critical" | "high" | "medium" = "medium";
          if (daysUntilEnd < 15) {
            riskLevel = "critical";
          } else if (daysUntilEnd < 30) {
            riskLevel = "high";
          }

          return {
            client_id: client.id,
            client_name: client.name,
            contract_end: client.contrato_fim!,
            days_until_end: daysUntilEnd,
            fee_mensal_centavos: client.fee_mensal_centavos || 0,
            risk_level: riskLevel,
          };
        })
        .filter((c) => c.days_until_end >= 0); // Only future or today

      return result;
    },
    enabled: !!organization?.id,
  });
}
