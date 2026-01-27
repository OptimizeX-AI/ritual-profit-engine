import { useSalesPerformance } from "@/hooks/useSalesPerformance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function SalesRanking() {
  const { data: performance, isLoading } = useSalesPerformance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            Ranking de Elite
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

  const getRankIcon = (index: number) => {
    if (index === 0)
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1)
      return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2)
      return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="w-5 text-center text-muted-foreground">{index + 1}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          Ranking de Elite
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!performance || performance.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma venda fechada este mês.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-center">Deals</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.map((perf, index) => (
                <TableRow
                  key={perf.salesperson_id}
                  className={cn(
                    index === 0 && "bg-yellow-50/50 dark:bg-yellow-900/10"
                  )}
                >
                  <TableCell>{getRankIcon(index)}</TableCell>
                  <TableCell className="font-medium">
                    {perf.salesperson_name}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{perf.deals_closed}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-profit">
                    {formatCurrency(perf.revenue_centavos)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(perf.average_ticket_centavos)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
