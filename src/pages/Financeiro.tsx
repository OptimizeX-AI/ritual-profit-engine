import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Wallet,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useTransactions, CreateTransactionInput, TransactionType, TransactionStatus } from "@/hooks/useTransactions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function Financeiro() {
  const {
    transactions,
    totalReceitas,
    totalDespesas,
    totalRepasses,
    saldoPrevisto,
    isLoading,
    createTransaction,
    deleteTransaction,
    isCreating,
  } = useTransactions();

  const [tab, setTab] = useState("transacoes");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTx, setNewTx] = useState<CreateTransactionInput>({
    description: "",
    category: "",
    value_centavos: 0,
    type: "receita",
    is_repasse: false,
    status: "pendente",
  });

  const formatCurrency = (valueInCents: number) =>
    (valueInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleCreateTransaction = () => {
    if (!newTx.description || !newTx.category) return;
    createTransaction(newTx);
    setNewTx({
      description: "",
      category: "",
      value_centavos: 0,
      type: "receita",
      is_repasse: false,
      status: "pendente",
    });
    setDialogOpen(false);
  };

  // DRE Calculation
  const receitaBruta = totalReceitas;
  const impostos = transactions
    .filter((t) => t.type === "despesa" && t.category.toLowerCase().includes("impost"))
    .reduce((s, t) => s + t.value_centavos, 0);
  const custosVariaveis = transactions
    .filter(
      (t) =>
        t.type === "despesa" &&
        !t.is_repasse &&
        (t.category.toLowerCase().includes("variáve") || t.category.toLowerCase().includes("freelanc"))
    )
    .reduce((s, t) => s + t.value_centavos, 0);
  const custosFixos = transactions
    .filter(
      (t) =>
        t.type === "despesa" &&
        !t.is_repasse &&
        !t.category.toLowerCase().includes("impost") &&
        !t.category.toLowerCase().includes("variáve") &&
        !t.category.toLowerCase().includes("freelanc")
    )
    .reduce((s, t) => s + t.value_centavos, 0);
  const margemContribuicao = receitaBruta - impostos - custosVariaveis;
  const lucroLiquido = margemContribuicao - custosFixos;

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
                <DialogDescription>Adicione uma receita ou despesa.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newTx.description}
                    onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                    placeholder="Ex: Fee Mensal - Cliente X"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={newTx.type}
                      onValueChange={(v) => setNewTx({ ...newTx, type: v as TransactionType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={newTx.category}
                      onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                      placeholder="Ex: Serviços"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input
                      id="value"
                      type="number"
                      value={(newTx.value_centavos || 0) / 100}
                      onChange={(e) =>
                        setNewTx({
                          ...newTx,
                          value_centavos: Math.round(parseFloat(e.target.value || "0") * 100),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newTx.status}
                      onValueChange={(v) => setNewTx({ ...newTx, status: v as TransactionStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTx.date || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateTransaction}
                  disabled={isCreating || !newTx.description || !newTx.category}
                >
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Transação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <p
                    className={cn(
                      "text-xl font-bold",
                      saldoPrevisto >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
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
                    {formatCurrency(totalRepasses)}
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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">Nenhuma transação encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Nova Transação" para adicionar.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/50">
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-12"></TableHead>
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
                            {tx.is_repasse && (
                              <Badge variant="outline" className="text-[10px] px-1.5">
                                REPASSE
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{tx.category}</TableCell>
                        <TableCell>
                          {new Date(tx.date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              tx.status === "pago" &&
                                "bg-profit/10 text-profit border-profit/20",
                              tx.status === "pendente" &&
                                "bg-warning/10 text-warning border-warning/20",
                              tx.status === "atrasado" &&
                                "bg-loss/10 text-loss border-loss/20"
                            )}
                          >
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium tabular-nums",
                            tx.type === "receita" ? "text-profit" : "text-loss"
                          )}
                        >
                          {tx.type === "receita" ? "+" : "-"}
                          {formatCurrency(tx.value_centavos)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteTransaction(tx.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                  <Badge variant="secondary">
                    {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-w-2xl">
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Receita Bruta (NF Serviços)</span>
                    <span className="font-bold tabular-nums">{formatCurrency(receitaBruta)}</span>
                  </div>

                  <div className="flex justify-between py-2 text-muted-foreground">
                    <span>(-) Impostos</span>
                    <span className="tabular-nums text-loss">({formatCurrency(impostos)})</span>
                  </div>

                  <div className="flex justify-between py-2 text-muted-foreground">
                    <span>(-) Custos Variáveis</span>
                    <span className="tabular-nums text-loss">
                      ({formatCurrency(custosVariaveis)})
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between py-2">
                    <span className="font-semibold">Margem de Contribuição</span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(margemContribuicao)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-muted-foreground">
                    <span>(-) Custos Fixos</span>
                    <span className="tabular-nums text-loss">({formatCurrency(custosFixos)})</span>
                  </div>

                  <Separator className="my-2" />

                  <div
                    className={cn(
                      "flex justify-between py-3 rounded-lg px-4 -mx-4",
                      lucroLiquido >= 0 ? "bg-profit/10" : "bg-loss/10"
                    )}
                  >
                    <span className="font-bold text-lg">EBITDA / Lucro Líquido</span>
                    <div className="text-right">
                      <span
                        className={cn(
                          "font-bold text-xl tabular-nums",
                          lucroLiquido >= 0 ? "text-profit" : "text-loss"
                        )}
                      >
                        {formatCurrency(lucroLiquido)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Margem:{" "}
                        {receitaBruta > 0
                          ? ((lucroLiquido / receitaBruta) * 100).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Sobre Repasses de Mídia</p>
                        <p className="mt-1">
                          Valores marcados como "Repasse" (ex: verba de Google Ads) não entram no
                          DRE como receita. Eles afetam apenas o fluxo de caixa, não a
                          rentabilidade da agência.
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
