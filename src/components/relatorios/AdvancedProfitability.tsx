import { useMemo } from "react";
import { useClientProfitability } from "@/hooks/useClientProfitability";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Users,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdvancedProfitability() {
  const { data: profitability, isLoading } = useClientProfitability();
  const { members } = useTeamMembers();

  // Calcular comissões por cliente (baseado no vendedor vinculado)
  const enrichedProfitability = useMemo(() => {
    if (!profitability) return [];

    return profitability.map((client) => {
      // Por enquanto, simular comissão média de 10% sobre receita
      // Futuramente: vincular vendedor ao cliente/projeto
      const comissaoEstimada = Math.round(client.revenue * 0.1);
      
      // Margem Real ajustada (descontando comissão)
      const lucroAjustado = client.profit - comissaoEstimada;
      const margemAjustada = client.revenue > 0 
        ? (lucroAjustado / client.revenue) * 100 
        : 0;

      return {
        ...client,
        comissaoEstimada,
        lucroAjustado,
        margemAjustada,
      };
    }).sort((a, b) => a.margemAjustada - b.margemAjustada); // Ordenar por pior margem
  }, [profitability]);

  const formatCurrency = (cents: number) =>
    `R$ ${(cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Rentabilidade Detalhada por Cliente
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          Margem real descontando comissão do vendedor
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                A <strong>Margem Ajustada</strong> desconta a comissão do vendedor (10% sobre faturamento por padrão).
                Isso mostra a rentabilidade real do projeto desde o início.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {enrichedProfitability.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custos</TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center gap-1 justify-end">
                    Comissão
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        10% sobre faturamento (configurável por vendedor)
                      </TooltipContent>
                    </Tooltip>
                  </span>
                </TableHead>
                <TableHead className="text-right">Lucro Ajustado</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="w-32">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedProfitability.map((client, index) => {
                const isNegative = client.margemAjustada < 0;
                const isLowMargin = client.margemAjustada < 20;
                const isTop3Problem = index < 3 && isLowMargin;

                return (
                  <TableRow
                    key={client.clientId}
                    className={cn(isTop3Problem && "bg-red-50/50 dark:bg-red-950/20")}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isTop3Problem && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{client.clientName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.revenue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(client.laborCost + client.directCosts)}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      ({formatCurrency(client.comissaoEstimada)})
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        isNegative ? "text-red-600" : "text-green-600"
                      )}
                    >
                      {formatCurrency(client.lucroAjustado)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16">
                          <Progress
                            value={Math.max(0, Math.min(100, client.margemAjustada))}
                            className={cn(
                              "h-2",
                              isLowMargin ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "font-bold text-sm",
                            isLowMargin ? "text-red-600" : "text-green-600"
                          )}
                        >
                          {client.margemAjustada.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isNegative ? (
                        <Badge variant="destructive" className="gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Prejuízo
                        </Badge>
                      ) : isLowMargin ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Risco
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Saudável
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
