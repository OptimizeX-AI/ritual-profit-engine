import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DRELine {
  label: string;
  value: number;
  isTotal?: boolean;
  isProfit?: boolean;
}

const dreData: DRELine[] = [
  { label: "Receita Bruta", value: 115000 },
  { label: "(-) Impostos", value: -10350 },
  { label: "(-) Custos Variáveis", value: -18400 },
  { label: "Margem de Contribuição", value: 86250, isTotal: true },
  { label: "(-) Custos Fixos", value: -52000 },
  { label: "EBITDA / Lucro Líquido", value: 34250, isTotal: true, isProfit: true },
];

export function DREMini() {
  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return value < 0 ? `(${formatted})` : formatted;
  };

  const profitMargin = (34250 / 115000 * 100).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">DRE Resumido - Janeiro</CardTitle>
          <span className="text-xs font-medium text-profit bg-profit/10 px-2 py-1 rounded-full">
            Margem: {profitMargin}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {dreData.map((line, index) => (
            <div key={line.label}>
              {line.isTotal && index > 0 && <Separator className="my-2" />}
              <div
                className={cn(
                  "flex items-center justify-between py-1",
                  line.isTotal && "font-semibold",
                  line.isProfit && "text-profit"
                )}
              >
                <span className={cn("text-sm", !line.isTotal && "text-muted-foreground")}>
                  {line.label}
                </span>
                <span className={cn(
                  "text-sm tabular-nums",
                  line.value < 0 && !line.isProfit && "text-loss"
                )}>
                  {formatCurrency(line.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
