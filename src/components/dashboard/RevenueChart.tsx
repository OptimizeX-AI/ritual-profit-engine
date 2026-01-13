import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { month: "Jan", receita: 85000, custos: 62000 },
  { month: "Fev", receita: 92000, custos: 58000 },
  { month: "Mar", receita: 78000, custos: 55000 },
  { month: "Abr", receita: 105000, custos: 68000 },
  { month: "Mai", receita: 98000, custos: 64000 },
  { month: "Jun", receita: 115000, custos: 72000 },
];

export function RevenueChart() {
  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Receita vs Custos</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
