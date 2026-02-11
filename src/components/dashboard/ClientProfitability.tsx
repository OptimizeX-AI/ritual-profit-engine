import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useClientProfitability } from "@/hooks/useClientProfitability";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientProfitability() {
  const { data: clients, isLoading } = useClientProfitability();

  const getMarginColor = (margin: number) => {
    if (margin >= 40) return "progress-profit";
    if (margin >= 20) return "progress-warning";
    return "progress-loss";
  };

  const getMarginText = (margin: number) => {
    if (margin >= 40) return "text-profit";
    if (margin >= 20) return "text-warning";
    return "text-loss";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Rentabilidade por Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : !clients || clients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum dado disponível. Cadastre clientes e lance transações.
          </p>
        ) : (
          <div className="space-y-4">
            {clients.slice(0, 5).map((client) => (
              <div key={client.clientId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{client.clientName}</span>
                  <span className={cn("text-sm font-bold", getMarginText(client.margin))}>
                    {client.margin.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={Math.max(0, Math.min(100, client.margin))}
                    className="h-2 flex-1"
                    indicatorClassName={getMarginColor(client.margin)}
                  />
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    R$ {(client.profit / 100).toLocaleString('pt-BR')}
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
