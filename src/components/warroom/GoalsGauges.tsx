import { useMonthlyGoals } from "@/hooks/useMonthlyGoals";
import { useCRMKanban } from "@/hooks/useCRMKanban";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, DollarSign, Users, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

interface GaugeCardProps {
  title: string;
  icon: React.ReactNode;
  target: number;
  achieved: number;
  format: "currency" | "number";
  color: string;
}

function GaugeCard({
  title,
  icon,
  target,
  achieved,
  format,
  color,
}: GaugeCardProps) {
  const percentage = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
  const overAchieved = achieved > target && target > 0;

  const formatValue = (value: number) => {
    if (format === "currency") {
      return formatCurrency(value);
    }
    return value.toLocaleString("pt-BR");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div
                className={cn(
                  "text-2xl font-bold",
                  overAchieved ? "text-profit" : ""
                )}
              >
                {formatValue(achieved)}
              </div>
              <div className="text-xs text-muted-foreground">
                Meta: {formatValue(target)}
              </div>
            </div>
            <div
              className={cn(
                "text-lg font-semibold",
                percentage >= 100
                  ? "text-profit"
                  : percentage >= 70
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            >
              {percentage.toFixed(0)}%
            </div>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                color
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
            {overAchieved && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-profit">
                🎯
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalsGauges() {
  const {
    faturamentoGoal,
    leadsGoal,
    vendasGoal,
    isLoading: loadingGoals,
  } = useMonthlyGoals();
  const { deals, isLoading: loadingDeals } = useCRMKanban();
  const { transactions, isLoading: loadingTransactions } = useTransactions();

  const isLoading = loadingGoals || loadingDeals || loadingTransactions;

  // Calculate achieved values from real data
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Revenue achieved: sum of income transactions this month (excluding repasse)
  const achievedRevenue = transactions
    .filter((t) => {
      if (t.type !== "receita" || t.is_repasse) return false;
      const txMonth = t.date.slice(0, 7);
      return txMonth === currentMonth;
    })
    .reduce((sum, t) => sum + t.value_centavos, 0);

  // Deals closed this month
  const dealsClosedThisMonth = deals.filter((d) => {
    if (d.stage !== "closed_won") return false;
    const dealMonth = d.updated_at.slice(0, 7);
    return dealMonth === currentMonth;
  });

  const achievedSales = dealsClosedThisMonth.length;

  // Pipeline leads (non-closed deals) - only count active pipeline stages
  const achievedLeads = deals.filter(
    (d) => d.stage === "prospecting" || d.stage === "proposal" || d.stage === "negotiation"
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <GaugeCard
        title="Meta Financeira"
        icon={<DollarSign className="h-4 w-4" />}
        target={faturamentoGoal?.target_value_centavos || 0}
        achieved={achievedRevenue}
        format="currency"
        color="bg-profit"
      />
      <GaugeCard
        title="Meta de Vendas"
        icon={<TrendingUp className="h-4 w-4" />}
        target={vendasGoal?.target_value_centavos || 0}
        achieved={achievedSales}
        format="number"
        color="bg-accent"
      />
      <GaugeCard
        title="Pipeline de Leads"
        icon={<Users className="h-4 w-4" />}
        target={leadsGoal?.target_value_centavos || 0}
        achieved={achievedLeads}
        format="number"
        color="bg-pending"
      />
    </div>
  );
}
