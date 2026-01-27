import { useClientProfitability } from "@/hooks/useClientProfitability";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ClientProfitabilityTable() {
  const { data: profitability, isLoading, error } = useClientProfitability();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Erro ao carregar rentabilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os dados de rentabilidade por cliente.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rentabilidade por Cliente</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profitability || profitability.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rentabilidade por Cliente</CardTitle>
          <CardDescription>Análise de margem real</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum cliente cadastrado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Rentabilidade por Cliente
        </CardTitle>
        <CardDescription>
          Margem real baseada em receitas, custos diretos e custo de pessoal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Custo Pessoal</TableHead>
              <TableHead className="text-right">Custos Diretos</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="text-right">Margem Real</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profitability.map((client) => {
              const isLowMargin = client.margin < 20;
              const isNegative = client.margin < 0;

              return (
                <TableRow key={client.clientId}>
                  <TableCell className="font-medium">{client.clientName}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(client.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(client.laborCost)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(client.directCosts)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      isNegative ? "text-destructive" : "text-profit"
                    )}
                  >
                    {formatCurrency(client.profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-semibold",
                        isLowMargin ? "text-destructive" : "text-profit"
                      )}
                    >
                      {isLowMargin ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                      {client.margin.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
