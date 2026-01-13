import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ClientData {
  name: string;
  receita: number;
  custos: number;
  margem: number;
}

const clientsData: ClientData[] = [
  { name: "Empresa Alpha", receita: 28000, custos: 14500, margem: 48 },
  { name: "Tech Solutions", receita: 22000, custos: 9800, margem: 55 },
  { name: "Startup Beta", receita: 15000, custos: 12000, margem: 20 },
  { name: "Indústria XYZ", receita: 35000, custos: 28700, margem: 18 },
  { name: "Comércio Plus", receita: 18000, custos: 8100, margem: 55 },
];

export function ClientProfitability() {
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
        <div className="space-y-4">
          {clientsData.map((client) => (
            <div key={client.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{client.name}</span>
                <span className={cn("text-sm font-bold", getMarginText(client.margem))}>
                  {client.margem}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Progress 
                  value={client.margem} 
                  className="h-2 flex-1"
                  indicatorClassName={getMarginColor(client.margem)}
                />
                <span className="text-xs text-muted-foreground w-24 text-right">
                  R$ {(client.receita - client.custos).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
