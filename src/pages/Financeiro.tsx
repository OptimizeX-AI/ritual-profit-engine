import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp,
  Wallet,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface Transaction {
  id: string;
  description: string;
  category: string;
  value: number;
  type: "receita" | "despesa";
  isRepasse: boolean;
  date: string;
  status: "pago" | "pendente" | "atrasado";
  project?: string;
}

const transactions: Transaction[] = [
  { id: "1", description: "Fee Mensal - Empresa Alpha", category: "Serviços", value: 28000, type: "receita", isRepasse: false, date: "2026-01-05", status: "pago", project: "Empresa Alpha" },
  { id: "2", description: "Verba Google Ads - Empresa Alpha", category: "Mídia/Ads", value: 15000, type: "receita", isRepasse: true, date: "2026-01-05", status: "pago", project: "Empresa Alpha" },
  { id: "3", description: "Fee Mensal - Tech Solutions", category: "Serviços", value: 22000, type: "receita", isRepasse: false, date: "2026-01-10", status: "pendente", project: "Tech Solutions" },
  { id: "4", description: "Aluguel Escritório", category: "Custos Fixos", value: 8500, type: "despesa", isRepasse: false, date: "2026-01-10", status: "pago" },
  { id: "5", description: "Salários + Encargos", category: "Folha", value: 42000, type: "despesa", isRepasse: false, date: "2026-01-05", status: "pago" },
  { id: "6", description: "Google Ads - Repasse", category: "Mídia/Ads", value: 15000, type: "despesa", isRepasse: true, date: "2026-01-08", status: "pago", project: "Empresa Alpha" },
  { id: "7", description: "Freelancer Design", category: "Custos Variáveis", value: 3500, type: "despesa", isRepasse: false, date: "2026-01-12", status: "pendente", project: "Startup Beta" },
  { id: "8", description: "Impostos NF (Simples)", category: "Impostos", value: 5400, type: "despesa", isRepasse: false, date: "2026-01-15", status: "pendente" },
];

// DRE Calculation
const receitaBruta = transactions.filter(t => t.type === "receita" && !t.isRepasse).reduce((s, t) => s + t.value, 0);
const repasses = transactions.filter(t => t.isRepasse).reduce((s, t) => s + t.value, 0) / 2;
const impostos = 5400;
const custosVariaveis = 3500;
const custosFixos = 50500;
const margemContribuicao = receitaBruta - impostos - custosVariaveis;
const lucroLiquido = margemContribuicao - custosFixos;

export default function Financeiro() {
  const [tab, setTab] = useState("transacoes");

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totalReceitas = transactions.filter(t => t.type === "receita" && !t.isRepasse).reduce((s, t) => s + t.value, 0);
  const totalDespesas = transactions.filter(t => t.type === "despesa" && !t.isRepasse).reduce((s, t) => s + t.value, 0);
  const saldoPrevisto = totalReceitas - totalDespesas;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão Financeira</h1>
            <p className="text-muted-foreground">
              A Última Linha: Faturamento é vaidade, Lucro é sanidade
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-profit/10">
                  <ArrowUpRight className="h-5 w-5 text-profit" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receitas (Serviço)</p>
                  <p className="text-xl font-bold text-profit">{formatCurrency(totalReceitas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-loss/10">
                  <ArrowDownLeft className="h-5 w-5 text-loss" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-xl font-bold text-loss">{formatCurrency(totalDespesas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Previsto</p>
                  <p className={cn("text-xl font-bold", saldoPrevisto >= 0 ? "text-profit" : "text-loss")}>
                    {formatCurrency(saldoPrevisto)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Repasses (Mídia)</p>
                  <p className="text-xl font-bold text-muted-foreground">
                    {formatCurrency(repasses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="transacoes">Transações</TabsTrigger>
            <TabsTrigger value="dre">DRE (P&L)</TabsTrigger>
          </TabsList>

          <TabsContent value="transacoes" className="mt-4">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tx.type === "receita" ? (
                            <ArrowUpRight className="h-4 w-4 text-profit" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-loss" />
                          )}
                          <span className="font-medium">{tx.description}</span>
                          {tx.isRepasse && (
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              REPASSE
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell>
                        {tx.project ? (
                          <Badge variant="secondary" className="font-normal">
                            {tx.project}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(tx.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            tx.status === "pago" && "bg-profit/10 text-profit border-profit/20",
                            tx.status === "pendente" && "bg-warning/10 text-warning border-warning/20",
                            tx.status === "atrasado" && "bg-loss/10 text-loss border-loss/20"
                          )}
                        >
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium tabular-nums",
                        tx.type === "receita" ? "text-profit" : "text-loss"
                      )}>
                        {tx.type === "receita" ? "+" : "-"}{formatCurrency(tx.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="dre" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    DRE - Demonstrativo de Resultados
                  </CardTitle>
                  <Badge variant="secondary">Janeiro 2026</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-w-2xl">
                  {/* Receita Bruta */}
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Receita Bruta (NF Serviços)</span>
                    <span className="font-bold tabular-nums">{formatCurrency(receitaBruta)}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 text-muted-foreground">
                    <span>(-) Impostos (Simples Nacional)</span>
                    <span className="tabular-nums text-loss">({formatCurrency(impostos)})</span>
                  </div>
                  
                  <div className="flex justify-between py-2 text-muted-foreground">
                    <span>(-) Custos Variáveis (Freelancers)</span>
                    <span className="tabular-nums text-loss">({formatCurrency(custosVariaveis)})</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between py-2">
                    <span className="font-semibold">Margem de Contribuição</span>
                    <span className="font-bold tabular-nums">{formatCurrency(margemContribuicao)}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 text-muted-foreground">
                    <span>(-) Custos Fixos (Salários, Aluguel, Software)</span>
                    <span className="tabular-nums text-loss">({formatCurrency(custosFixos)})</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className={cn(
                    "flex justify-between py-3 rounded-lg px-4 -mx-4",
                    lucroLiquido >= 0 ? "bg-profit/10" : "bg-loss/10"
                  )}>
                    <span className="font-bold text-lg">EBITDA / Lucro Líquido</span>
                    <div className="text-right">
                      <span className={cn(
                        "font-bold text-xl tabular-nums",
                        lucroLiquido >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {formatCurrency(lucroLiquido)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Margem: {((lucroLiquido / receitaBruta) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Info sobre repasses */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Sobre Repasses de Mídia</p>
                        <p className="mt-1">
                          Valores marcados como "Repasse" (ex: verba de Google Ads) não entram no DRE como receita. 
                          Eles afetam apenas o fluxo de caixa, não a rentabilidade da agência.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
