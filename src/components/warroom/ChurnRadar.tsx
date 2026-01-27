import { useChurnRadar } from "@/hooks/useChurnRadar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Loader2, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function formatCurrency(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function ChurnRadar() {
  const { data: churnRisks, isLoading } = useChurnRadar(60);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Radar de Churn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAtRisk =
    churnRisks?.reduce((sum, r) => sum + r.fee_mensal_centavos, 0) || 0;

  const criticalCount = churnRisks?.filter((r) => r.risk_level === "critical").length || 0;
  const highCount = churnRisks?.filter((r) => r.risk_level === "high").length || 0;

  const getRiskBadge = (level: "critical" | "high" | "medium") => {
    if (level === "critical") {
      return (
        <Badge variant="destructive" className="text-xs">
          Crítico
        </Badge>
      );
    }
    if (level === "high") {
      return (
        <Badge
          variant="outline"
          className="border-warning text-warning text-xs"
        >
          Alto
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Médio
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                criticalCount > 0 ? "text-destructive" : "text-warning"
              )}
            />
            Radar de Churn
          </div>
          {totalAtRisk > 0 && (
            <Badge variant="outline" className="font-mono">
              {formatCurrency(totalAtRisk)}/mês em risco
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!churnRisks || churnRisks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum contrato vencendo em 60 dias.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            {(criticalCount > 0 || highCount > 0) && (
              <div className="flex gap-4 text-sm pb-2 border-b">
                {criticalCount > 0 && (
                  <span className="text-destructive font-medium">
                    {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
                  </span>
                )}
                {highCount > 0 && (
                  <span className="text-warning font-medium">
                    {highCount} alto{highCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            {/* Client list */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {churnRisks.map((risk) => (
                <div
                  key={risk.client_id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    risk.risk_level === "critical" &&
                      "border-destructive/50 bg-destructive/5",
                    risk.risk_level === "high" &&
                      "border-warning/50 bg-warning/5"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">
                      {risk.client_name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(parseISO(risk.contract_end), "dd MMM yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      <span className="font-medium">
                        ({risk.days_until_end} dias)
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getRiskBadge(risk.risk_level)}
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(risk.fee_mensal_centavos)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
