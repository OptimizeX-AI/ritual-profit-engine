import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, MoreHorizontal, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  fee: number;
  startDate: string;
  endDate: string | null;
  status: "active" | "at_risk" | "churned";
  margin: number;
  hoursUsed: number;
  hoursContracted: number;
}

const clients: Client[] = [
  {
    id: "1",
    name: "Empresa Alpha Ltda",
    fee: 28000,
    startDate: "2024-03-15",
    endDate: null,
    status: "active",
    margin: 48,
    hoursUsed: 85,
    hoursContracted: 100,
  },
  {
    id: "2",
    name: "Tech Solutions S.A.",
    fee: 22000,
    startDate: "2024-06-01",
    endDate: null,
    status: "active",
    margin: 55,
    hoursUsed: 42,
    hoursContracted: 60,
  },
  {
    id: "3",
    name: "Startup Beta Inc",
    fee: 15000,
    startDate: "2025-01-10",
    endDate: null,
    status: "at_risk",
    margin: 12,
    hoursUsed: 95,
    hoursContracted: 80,
  },
  {
    id: "4",
    name: "Indústria XYZ",
    fee: 35000,
    startDate: "2023-08-20",
    endDate: null,
    status: "active",
    margin: 32,
    hoursUsed: 110,
    hoursContracted: 120,
  },
  {
    id: "5",
    name: "Comércio Plus",
    fee: 18000,
    startDate: "2024-11-01",
    endDate: null,
    status: "at_risk",
    margin: 8,
    hoursUsed: 78,
    hoursContracted: 60,
  },
];

const statusConfig = {
  active: { label: "Ativo", className: "bg-profit/10 text-profit border-profit/20" },
  at_risk: { label: "Em Risco", className: "bg-warning/10 text-warning border-warning/20" },
  churned: { label: "Cancelado", className: "bg-loss/10 text-loss border-loss/20" },
};

export default function Clientes() {
  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR");

  const getOverserviceStatus = (used: number, contracted: number) => {
    const ratio = used / contracted;
    if (ratio >= 1) return "loss";
    if (ratio >= 0.9) return "warning";
    return "profit";
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Clientes</h1>
            <p className="text-muted-foreground">
              Contratos, fees e rentabilidade
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." className="pl-9" />
          </div>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-profit" />
            {clients.filter((c) => c.status === "active").length} ativos
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-warning" />
            {clients.filter((c) => c.status === "at_risk").length} em risco
          </Badge>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>Fee Mensal</TableHead>
                <TableHead>Início Contrato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>Escopo (h)</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const scopeStatus = getOverserviceStatus(client.hoursUsed, client.hoursContracted);
                const scopePercent = Math.round((client.hoursUsed / client.hoursContracted) * 100);
                
                return (
                  <TableRow
                    key={client.id}
                    className={cn(
                      client.status === "at_risk" && "table-row-warning"
                    )}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{formatCurrency(client.fee)}</TableCell>
                    <TableCell>{formatDate(client.startDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig[client.status].className}>
                        {statusConfig[client.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {client.margin >= 30 ? (
                          <TrendingUp className="h-4 w-4 text-profit" />
                        ) : client.margin >= 15 ? (
                          <TrendingDown className="h-4 w-4 text-warning" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-loss" />
                        )}
                        <span
                          className={cn(
                            "font-medium",
                            client.margin >= 30 && "text-profit",
                            client.margin >= 15 && client.margin < 30 && "text-warning",
                            client.margin < 15 && "text-loss"
                          )}
                        >
                          {client.margin}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              scopeStatus === "profit" && "bg-profit",
                              scopeStatus === "warning" && "bg-warning",
                              scopeStatus === "loss" && "bg-loss"
                            )}
                            style={{ width: `${Math.min(scopePercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {client.hoursUsed}/{client.hoursContracted}h
                        </span>
                        {scopePercent > 100 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            +{scopePercent - 100}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
