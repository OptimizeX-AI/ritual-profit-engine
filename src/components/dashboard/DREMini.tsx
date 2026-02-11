import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAdvancedDRE } from "@/hooks/useAdvancedDRE";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DRELine {
  label: string;
  value: number;
  isTotal?: boolean;
  isProfit?: boolean;
}

export function DREMini() {
  const { dreData, isLoading } = useAdvancedDRE();

  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return value < 0 ? `(${formatted})` : formatted;
  };

  const hasData = dreData.receitaBruta > 0 || dreData.custosFixos > 0 || dreData.custosVariaveis > 0;

  const lines: DRELine[] = [
    { label: "Receita Bruta", value: dreData.receitaBruta },
    { label: "(-) Impostos", value: -dreData.impostos },
    { label: "(-) Custos Variáveis", value: -dreData.custosVariaveis },
    { label: "Margem de Contribuição", value: dreData.margemContribuicao, isTotal: true },
    { label: "(-) Custos Fixos", value: -dreData.custosFixos },
    { label: "EBITDA / Lucro Líquido", value: dreData.lucroLiquido, isTotal: true, isProfit: true },
  ];

  const profitMargin = dreData.margemLiquida.toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">DRE Resumido - {capitalizedMonth}</CardTitle>
          {hasData && (
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              dreData.lucroLiquido >= 0 ? "text-profit bg-profit/10" : "text-loss bg-loss/10"
            )}>
              Margem: {profitMargin}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : !hasData ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum dado disponível. Lance transações no Financeiro.
          </p>
        ) : (
          <div className="space-y-2">
            {lines.map((line, index) => (
              <div key={line.label}>
                {line.isTotal && index > 0 && <Separator className="my-2" />}
                <div
                  className={cn(
                    "flex items-center justify-between py-1",
                    line.isTotal && "font-semibold",
                    line.isProfit && (line.value >= 0 ? "text-profit" : "text-loss")
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
        )}
      </CardContent>
    </Card>
  );
}
