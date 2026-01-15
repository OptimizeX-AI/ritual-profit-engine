import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  Wallet,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Calendar,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useTransactions, CreateTransactionInput, TransactionType, TransactionStatus, Transaction } from "@/hooks/useTransactions";
import { useProjects } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

// Categorias predefinidas
const CATEGORIAS_RECEITA = [
  "Fee Mensal",
  "Projeto Pontual",
  "Consultoria",
  "Comissão",
  "Outros",
];

const CATEGORIAS_DESPESA = [
  "Salários",
  "Freelancers",
  "Aluguel",
  "Ferramentas/Software",
  "Compra de Mídia/Ads",
  "Impostos",
  "Marketing",
  "Administrativo",
  "Outros",
];

type TransactionFormData = Omit<CreateTransactionInput, 'is_repasse'> & {
  is_repasse: boolean;
};

const defaultFormData: TransactionFormData = {
  description: "",
  category: "",
  value_centavos: 0,
  type: "receita",
  is_repasse: false,
  status: "pendente",
  date: new Date().toISOString().split("T")[0],
  project_id: undefined,
  notes: "",
};

export default function Financeiro() {
  const {
    transactions,
    totalReceitas,
    totalDespesas,
    totalRepasses,
    saldoPrevisto,
    saldoRealizado,
    fluxoCaixa,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
  } = useTransactions();

  const { projects } = useProjects();
  const { clients } = useClients();

  const [tab, setTab] = useState("transacoes");
  const [filterTab, setFilterTab] = useState<"todas" | "receitas" | "despesas" | "pendentes">("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>(defaultFormData);

  const formatCurrency = (valueInCents: number) =>
    (valueInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormData({
      description: tx.description,
      category: tx.category,
      value_centavos: tx.value_centavos,
      type: tx.type,
      is_repasse: tx.is_repasse,
      status: tx.status,
      date: tx.date,
      project_id: tx.project_id || undefined,
      notes: tx.notes || "",
    });
    setDialogOpen(true);
  };

  const handleCategoryChange = (category: string) => {
    const isMediaCategory = category === "Compra de Mídia/Ads";
    setFormData({
      ...formData,
      category,
      is_repasse: isMediaCategory ? true : formData.is_repasse,
    });
  };

  const handleSave = () => {
    if (!formData.description || !formData.category) return;

    if (editingTransaction) {
      updateTransaction({
        id: editingTransaction.id,
        description: formData.description,
        category: formData.category,
        value_centavos: formData.value_centavos,
        type: formData.type,
        is_repasse: formData.is_repasse,
        status: formData.status,
        date: formData.date,
        project_id: formData.project_id || null,
        notes: formData.notes || null,
      });
    } else {
      createTransaction(formData);
    }

    setFormData(defaultFormData);
    setEditingTransaction(null);
    setDialogOpen(false);
  };

  // Get project info helper
  const getProjectInfo = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;
    const client = clients.find((c) => c.id === project.client_id);
    return { project, client };
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterTab === "todas") return true;
    if (filterTab === "receitas") return tx.type === "receita";
    if (filterTab === "despesas") return tx.type === "despesa";
    if (filterTab === "pendentes") return tx.status === "pendente";
    return true;
  });

  // Contas a Pagar e Receber
  const contasReceber = transactions.filter(
    (t) => t.type === "receita" && t.status === "pendente"
  );
  const contasPagar = transactions.filter(
    (t) => t.type === "despesa" && t.status === "pendente"
  );

  const totalContasReceber = contasReceber.reduce((acc, t) => acc + t.value_centavos, 0);
  const totalContasPagar = contasPagar.reduce((acc, t) => acc + t.value_centavos, 0);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão Financeira</h1>
            <p className="text-muted-foreground">
              Controle de receitas, despesas e fluxo de caixa
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? "Editar Transação" : "Nova Transação"}
                </DialogTitle>
                <DialogDescription>
                  {editingTransaction
                    ? "Atualize os dados da transação."
                    : "Adicione uma receita ou despesa."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Ex: Fee Mensal - Cliente X"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          type: v as TransactionType,
                          category: "", // Reset category when type changes
                          is_repasse: false,
                        })
                      }
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
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.type === "receita"
                          ? CATEGORIAS_RECEITA
                          : CATEGORIAS_DESPESA
                        ).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor (R$) *</Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={(formData.value_centavos || 0) / 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          value_centavos: Math.round(
                            parseFloat(e.target.value || "0") * 100
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({ ...formData, status: v as TransactionStatus })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">
                          {formData.type === "receita" ? "Recebido" : "Pago"}
                        </SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto (Opcional)</Label>
                    <Select
                      value={formData.project_id || "none"}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          project_id: v === "none" ? undefined : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (Custo Fixo)</SelectItem>
                        {projects.map((project) => {
                          const client = clients.find(
                            (c) => c.id === project.client_id
                          );
                          return (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                              {client ? ` (${client.name})` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Repasse checkbox - only show for Compra de Mídia */}
                {formData.category === "Compra de Mídia/Ads" && (
                  <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <Checkbox
                      id="is_repasse"
                      checked={formData.is_repasse}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_repasse: checked as boolean })
                      }
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="is_repasse"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Marcar como Repasse de Mídia
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Repasses não entram como receita/despesa operacional. Afetam
                        apenas o fluxo de caixa, não o DRE.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Anotações adicionais..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingTransaction(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    isCreating ||
                    isUpdating ||
                    !formData.description ||
                    !formData.category
                  }
                >
                  {(isCreating || isUpdating) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTransaction ? "Salvar Alterações" : "Criar Transação"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-profit/10">
                  <ArrowUpRight className="h-5 w-5 text-profit" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receitas (Operacional)</p>
                  <p className="text-xl font-bold text-profit">
                    {formatCurrency(totalReceitas)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Excluindo repasses de mídia
                  </p>
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
                  <p className="text-sm text-muted-foreground">Despesas (Operacional)</p>
                  <p className="text-xl font-bold text-loss">
                    {formatCurrency(totalDespesas)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Excluindo repasses de mídia
                  </p>
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
                  <p className="text-sm text-muted-foreground">Saldo Operacional</p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      saldoPrevisto >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
                    {formatCurrency(saldoPrevisto)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receitas - Despesas
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
                  <p className="text-xs text-muted-foreground">
                    Não afeta resultado operacional
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
            <TabsTrigger value="contas">Contas a Pagar/Receber</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          </TabsList>

          <TabsContent value="transacoes" className="mt-4 space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-2">
              <Button
                variant={filterTab === "todas" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterTab("todas")}
              >
                Todas ({transactions.length})
              </Button>
              <Button
                variant={filterTab === "receitas" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterTab("receitas")}
              >
                Receitas
              </Button>
              <Button
                variant={filterTab === "despesas" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterTab("despesas")}
              >
                Despesas
              </Button>
              <Button
                variant={filterTab === "pendentes" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterTab("pendentes")}
              >
                Pendentes
              </Button>
            </div>

            <div className="rounded-lg border bg-card">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">
                    Nenhuma transação encontrada
                  </p>
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
                      <TableHead>Projeto</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => {
                      const projectInfo = getProjectInfo(tx.project_id);
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tx.type === "receita" ? (
                                <ArrowUpRight className="h-4 w-4 text-profit flex-shrink-0" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-loss flex-shrink-0" />
                              )}
                              <span className="font-medium">{tx.description}</span>
                              {tx.is_repasse && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 bg-warning/10 text-warning border-warning/20"
                                >
                                  REPASSE
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{tx.category}</span>
                          </TableCell>
                          <TableCell>
                            {projectInfo ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span>{projectInfo.project.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(tx.date).toLocaleDateString("pt-BR")}
                            </div>
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
                              {tx.status === "pago"
                                ? tx.type === "receita"
                                  ? "Recebido"
                                  : "Pago"
                                : tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
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
                                <DropdownMenuItem onClick={() => handleOpenEdit(tx)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
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
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contas" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Contas a Receber */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ArrowUpRight className="h-5 w-5 text-profit" />
                    Contas a Receber
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contasReceber.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma conta a receber pendente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {contasReceber.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Vence em {new Date(tx.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <span className="font-bold text-profit tabular-nums">
                            {formatCurrency(tx.value_centavos)}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between pt-2">
                        <span className="font-semibold">Total a Receber</span>
                        <span className="font-bold text-profit tabular-nums">
                          {formatCurrency(totalContasReceber)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contas a Pagar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ArrowDownLeft className="h-5 w-5 text-loss" />
                    Contas a Pagar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contasPagar.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma conta a pagar pendente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {contasPagar.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Vence em {new Date(tx.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <span className="font-bold text-loss tabular-nums">
                            {formatCurrency(tx.value_centavos)}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between pt-2">
                        <span className="font-semibold">Total a Pagar</span>
                        <span className="font-bold text-loss tabular-nums">
                          {formatCurrency(totalContasPagar)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fluxo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Resumo de Fluxo de Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-2xl">
                  {/* Operacional */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Operacional (Serviços)
                    </h3>
                    <div className="flex justify-between py-2">
                      <span>Receitas de Serviços</span>
                      <span className="font-medium text-profit tabular-nums">
                        +{formatCurrency(totalReceitas)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Despesas Operacionais</span>
                      <span className="font-medium text-loss tabular-nums">
                        -{formatCurrency(totalDespesas)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">Resultado Operacional</span>
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          saldoPrevisto >= 0 ? "text-profit" : "text-loss"
                        )}
                      >
                        {formatCurrency(saldoPrevisto)}
                      </span>
                    </div>
                  </div>

                  {/* Repasses */}
                  <div className="space-y-2 mt-6">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Repasses de Mídia (Não-operacional)
                    </h3>
                    <div className="flex justify-between py-2">
                      <span>Total de Repasses</span>
                      <span className="font-medium text-muted-foreground tabular-nums">
                        {formatCurrency(totalRepasses)}
                      </span>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Repasses de mídia transitam pelo caixa mas não representam receita
                      ou despesa operacional da agência.
                    </div>
                  </div>

                  {/* Fluxo Total */}
                  <Separator className="my-4" />
                  <div
                    className={cn(
                      "flex justify-between py-4 px-4 -mx-4 rounded-lg",
                      fluxoCaixa >= 0 ? "bg-profit/10" : "bg-loss/10"
                    )}
                  >
                    <span className="font-bold text-lg">Fluxo de Caixa Total</span>
                    <span
                      className={cn(
                        "font-bold text-xl tabular-nums",
                        fluxoCaixa >= 0 ? "text-profit" : "text-loss"
                      )}
                    >
                      {formatCurrency(fluxoCaixa)}
                    </span>
                  </div>

                  {/* Realized vs Predicted */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Saldo Realizado</p>
                        <p
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            saldoRealizado >= 0 ? "text-profit" : "text-loss"
                          )}
                        >
                          {formatCurrency(saldoRealizado)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Apenas transações pagas/recebidas
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Saldo Previsto</p>
                        <p
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            saldoPrevisto >= 0 ? "text-profit" : "text-loss"
                          )}
                        >
                          {formatCurrency(saldoPrevisto)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Incluindo pendentes
                        </p>
                      </CardContent>
                    </Card>
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
