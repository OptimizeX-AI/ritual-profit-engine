import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Info,
  Shield,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  useTransactions,
  CreateTransactionInput,
  TransactionType,
  TransactionStatus,
  TransactionNature,
  CostType,
  Transaction,
} from "@/hooks/useTransactions";
import { useProjects } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
  isCategoriaRepasse,
  validateRepasse,
} from "@/lib/financialValidation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TransactionFormData = {
  description: string;
  category: string;
  value_centavos: number;
  type: TransactionType;
  nature: TransactionNature;
  cost_type: CostType;
  is_repasse: boolean;
  date: string;
  competence_date: string;
  payment_date: string;
  status: TransactionStatus;
  project_id: string | undefined;
  notes: string;
};

const defaultFormData: TransactionFormData = {
  description: "",
  category: "",
  value_centavos: 0,
  type: "receita",
  nature: "operacional",
  cost_type: "fixo",
  is_repasse: false,
  date: new Date().toISOString().split("T")[0],
  competence_date: new Date().toISOString().split("T")[0],
  payment_date: "",
  status: "pendente",
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
    custosDiretos,
    custosFixos,
    contasReceber,
    contasPagar,
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
  const [filterTab, setFilterTab] = useState<"todas" | "receitas" | "despesas" | "pendentes" | "repasses">("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>(defaultFormData);
  const [validationError, setValidationError] = useState<string | null>(null);

  const formatCurrency = (valueInCents: number) =>
    (valueInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormData(defaultFormData);
    setValidationError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormData({
      description: tx.description,
      category: tx.category,
      value_centavos: tx.value_centavos,
      type: tx.type,
      nature: tx.nature || "operacional",
      cost_type: tx.cost_type || "fixo",
      is_repasse: tx.is_repasse,
      status: tx.status,
      date: tx.date,
      competence_date: tx.competence_date || tx.date,
      payment_date: tx.payment_date || "",
      project_id: tx.project_id || undefined,
      notes: tx.notes || "",
    });
    setValidationError(null);
    setDialogOpen(true);
  };

  const handleCategoryChange = (category: string) => {
    const isMediaCategory = isCategoriaRepasse(category);
    
    // Auto-marca como repasse se for categoria de mídia
    const newIsRepasse = isMediaCategory ? true : formData.is_repasse;
    
    // Se for repasse, força natureza não operacional
    const newNature = newIsRepasse ? "nao_operacional" : formData.nature;

    setFormData({
      ...formData,
      category,
      is_repasse: newIsRepasse,
      nature: newNature,
    });
    setValidationError(null);
  };

  const handleRepasseChange = (checked: boolean) => {
    // Valida se pode ser repasse
    if (checked) {
      const validation = validateRepasse(true, formData.category, formData.type);
      if (!validation.valid) {
        setValidationError(validation.error || "Configuração inválida para repasse");
        return;
      }
    }

    setFormData({
      ...formData,
      is_repasse: checked,
      // Se for repasse, SEMPRE força natureza não operacional
      nature: checked ? "nao_operacional" : "operacional",
    });
    setValidationError(null);
  };

  const handleProjectChange = (projectId: string) => {
    const hasProject = projectId !== "none";
    setFormData({
      ...formData,
      project_id: hasProject ? projectId : undefined,
      // Se tem projeto, é custo direto
      cost_type: hasProject ? "direto" : "fixo",
    });
  };

  const handleStatusChange = (status: TransactionStatus) => {
    setFormData({
      ...formData,
      status,
      // Se marcou como pago, registra data de pagamento
      payment_date: status === "pago" && !formData.payment_date
        ? new Date().toISOString().split("T")[0]
        : formData.payment_date,
    });
  };

  const handleSave = () => {
    if (!formData.description || !formData.category) {
      setValidationError("Preencha todos os campos obrigatórios");
      return;
    }

    // Valida repasse
    if (formData.is_repasse) {
      const validation = validateRepasse(true, formData.category, formData.type);
      if (!validation.valid) {
        setValidationError(validation.error || "Configuração inválida para repasse");
        return;
      }
    }

    const input: CreateTransactionInput = {
      description: formData.description,
      category: formData.category,
      value_centavos: formData.value_centavos,
      type: formData.type,
      nature: formData.is_repasse ? "nao_operacional" : formData.nature,
      cost_type: formData.project_id ? "direto" : "fixo",
      is_repasse: formData.is_repasse,
      date: formData.date,
      competence_date: formData.competence_date || formData.date,
      payment_date: formData.payment_date || null,
      status: formData.status,
      project_id: formData.project_id || null,
      notes: formData.notes || null,
    };

    if (editingTransaction) {
      updateTransaction({
        id: editingTransaction.id,
        ...input,
      });
    } else {
      createTransaction(input);
    }

    setFormData(defaultFormData);
    setEditingTransaction(null);
    setDialogOpen(false);
    setValidationError(null);
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
    if (filterTab === "receitas") return tx.type === "receita" && !tx.is_repasse;
    if (filterTab === "despesas") return tx.type === "despesa" && !tx.is_repasse;
    if (filterTab === "pendentes") return tx.status === "pendente";
    if (filterTab === "repasses") return tx.is_repasse;
    return true;
  });

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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              
              {validationError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {validationError}
                </div>
              )}

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
                          category: "",
                          is_repasse: false,
                          nature: "operacional",
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={handleStatusChange}
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
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Datas - Modelo Caixa vs Competência */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">Datas</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          <strong>Competência:</strong> Quando a transação aconteceu contabilmente.<br />
                          <strong>Vencimento:</strong> Data prevista para pagamento.<br />
                          <strong>Pagamento:</strong> Quando foi efetivamente pago/recebido.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="competence_date" className="text-xs text-muted-foreground">
                        Competência
                      </Label>
                      <Input
                        id="competence_date"
                        type="date"
                        value={formData.competence_date}
                        onChange={(e) =>
                          setFormData({ ...formData, competence_date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-xs text-muted-foreground">
                        Vencimento
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_date" className="text-xs text-muted-foreground">
                        Pagamento
                      </Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) =>
                          setFormData({ ...formData, payment_date: e.target.value })
                        }
                        disabled={formData.status !== "pago"}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projeto (Opcional)</Label>
                  <Select
                    value={formData.project_id || "none"}
                    onValueChange={handleProjectChange}
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
                  <p className="text-xs text-muted-foreground">
                    {formData.project_id 
                      ? "Custo direto do projeto" 
                      : "Custo fixo da agência"}
                  </p>
                </div>

                {/* Repasse - Blindagem com Switch */}
                <div className={cn(
                  "flex items-center justify-between gap-4 p-4 rounded-lg border",
                  formData.is_repasse 
                    ? "bg-warning/10 border-warning/30" 
                    : "bg-muted/50 border-border"
                )}>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="is_repasse"
                        className="text-sm font-medium cursor-pointer"
                      >
                        É Repasse de Mídia?
                      </Label>
                      <Shield className="h-4 w-4 text-warning" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isCategoriaRepasse(formData.category) 
                        ? "Categoria compatível com repasse de mídia"
                        : "Ative para marcar como repasse de mídia"}
                    </p>
                  </div>
                  <Switch
                    id="is_repasse"
                    checked={formData.is_repasse}
                    onCheckedChange={handleRepasseChange}
                  />
                </div>

                {/* Alerta visual quando is_repasse = true */}
                {formData.is_repasse && (
                  <Alert className="border-warning/50 bg-warning/10">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm text-warning-foreground">
                      ⚠️ Este valor não será contabilizado como Receita Operacional no DRE
                    </AlertDescription>
                  </Alert>
                )}

                {/* Info sobre classificação */}
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Natureza:</span>
                    <Badge variant="outline" className="text-[10px]">
                      {formData.is_repasse ? "Não Operacional" : "Operacional"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Custo:</span>
                    <Badge variant="outline" className="text-[10px]">
                      {formData.project_id ? "Direto" : "Fixo"}
                    </Badge>
                  </div>
                </div>

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
                    setValidationError(null);
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
                  <TrendingUp className="h-5 w-5 text-profit" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receitas Operacionais</p>
                  <p className="text-xl font-bold text-profit">
                    {formatCurrency(totalReceitas)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Excluindo repasses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-loss/10">
                  <TrendingDown className="h-5 w-5 text-loss" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Operacionais</p>
                  <p className="text-xl font-bold text-loss">
                    {formatCurrency(totalDespesas)}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Diretos: {formatCurrency(custosDiretos)}</span>
                    <span>Fixos: {formatCurrency(custosFixos)}</span>
                  </div>
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
                  <p className="text-sm text-muted-foreground">Resultado Operacional</p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      saldoPrevisto >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
                    {formatCurrency(saldoPrevisto)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Realizado: {formatCurrency(saldoRealizado)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Shield className="h-5 w-5 text-warning" />
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
            <div className="flex gap-2 flex-wrap">
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
              <Button
                variant={filterTab === "repasses" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterTab("repasses")}
              >
                <Shield className="h-3 w-3 mr-1" />
                Repasses
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
                      <TableHead>Competência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => {
                      const projectInfo = getProjectInfo(tx.project_id);
                      return (
                        <TableRow key={tx.id} className={cn(
                          tx.is_repasse && "bg-warning/5"
                        )}>
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
                                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                                  REPASSE
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm">{tx.category}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {tx.cost_type === "direto" ? "Custo Direto" : "Custo Fixo"}
                              </span>
                            </div>
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
                              {tx.competence_date 
                                ? new Date(tx.competence_date).toLocaleDateString("pt-BR")
                                : new Date(tx.date).toLocaleDateString("pt-BR")}
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
                                  "bg-loss/10 text-loss border-loss/20",
                                tx.status === "cancelado" &&
                                  "bg-muted text-muted-foreground"
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
                              tx.is_repasse 
                                ? "text-muted-foreground"
                                : tx.type === "receita" ? "text-profit" : "text-loss"
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
                  <CardDescription>
                    Receitas pendentes de recebimento
                  </CardDescription>
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
                  <CardDescription>
                    Despesas pendentes de pagamento
                  </CardDescription>
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
                <CardDescription>
                  Visão consolidada: operacional + repasses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-w-2xl">
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
                      <div className="flex flex-col">
                        <span>Despesas Operacionais</span>
                        <span className="text-xs text-muted-foreground">
                          Custos Diretos: {formatCurrency(custosDiretos)} | Custos Fixos: {formatCurrency(custosFixos)}
                        </span>
                      </div>
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Repasses de Mídia
                      </h3>
                      <Shield className="h-4 w-4 text-warning" />
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Total de Repasses</span>
                      <span className="font-medium text-muted-foreground tabular-nums">
                        {formatCurrency(totalRepasses)}
                      </span>
                    </div>
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-warning">Repasses Blindados</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Repasses de mídia transitam pelo caixa mas <strong>não representam 
                            receita ou despesa operacional</strong>. Não afetam DRE, margem ou 
                            rentabilidade por cliente.
                          </p>
                        </div>
                      </div>
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
