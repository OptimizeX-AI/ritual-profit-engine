import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RevenueChart() {
  const { transactions, isLoading } = useTransactions();

  const data = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, "MMM", { locale: ptBR });
      const capitalLabel = label.charAt(0).toUpperCase() + label.slice(1);

      const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= start && d <= end && !t.is_repasse;
      });

      const receita = monthTransactions
        .filter((t) => t.type === "receita")
        .reduce((sum, t) => sum + t.value_centavos, 0) / 100;

      const custos = monthTransactions
        .filter((t) => t.type === "despesa")
        .reduce((sum, t) => sum + t.value_centavos, 0) / 100;

      months.push({ month: capitalLabel, receita, custos });
    }

    return months;
  }, [transactions]);

  const hasData = data.some((d) => d.receita > 0 || d.custos > 0);

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Receita vs Custos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !hasData ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Nenhum dado disponível. Lance transações no Financeiro.
            </p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(207, 79%, 28%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(207, 79%, 28%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCustos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(210, 20%, 45%)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(210, 20%, 45%)', fontSize: 12 }}
                  tickFormatter={(value) => `R$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(210, 20%, 88%)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="hsl(207, 79%, 28%)"
                  strokeWidth={2}
                  fill="url(#colorReceita)"
                  name="Receita"
                />
                <Area
                  type="monotone"
                  dataKey="custos"
                  stroke="hsl(0, 72%, 51%)"
                  strokeWidth={2}
                  fill="url(#colorCustos)"
                  name="Custos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
