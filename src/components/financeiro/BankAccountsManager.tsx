import { useState } from "react";
import { useBankAccounts, CreateBankAccountInput } from "@/hooks/useBankAccounts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Star, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BankAccountsManager() {
  const {
    accounts,
    saldoConsolidado,
    isLoading,
    createAccount,
    deleteAccount,
    isCreating,
  } = useBankAccounts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateBankAccountInput>({
    name: "",
    banco: "",
    agencia: "",
    conta: "",
    saldo_inicial_centavos: 0,
    is_default: false,
  });

  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSave = () => {
    if (!formData.name) return;
    createAccount(formData);
    setFormData({
      name: "",
      banco: "",
      agencia: "",
      conta: "",
      saldo_inicial_centavos: 0,
      is_default: false,
    });
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contas Bancárias
            </CardTitle>
            <CardDescription>
              Gerencie suas contas para controle de fluxo de caixa
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Conta Bancária</DialogTitle>
                <DialogDescription>
                  Adicione uma conta para controle de transações
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Conta *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Conta Principal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      value={formData.banco || ""}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                      placeholder="Ex: Itaú"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencia">Agência</Label>
                    <Input
                      id="agencia"
                      value={formData.agencia || ""}
                      onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                      placeholder="0000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="conta">Número da Conta</Label>
                    <Input
                      id="conta"
                      value={formData.conta || ""}
                      onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                      placeholder="00000-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saldo">Saldo Inicial (R$)</Label>
                    <Input
                      id="saldo"
                      type="number"
                      step="0.01"
                      value={(formData.saldo_inicial_centavos || 0) / 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          saldo_inicial_centavos: Math.round(parseFloat(e.target.value || "0") * 100),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_default: checked })
                    }
                  />
                  <Label htmlFor="default">Definir como conta padrão</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isCreating || !formData.name}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma conta bancária cadastrada.</p>
            <p className="text-sm">Clique em "Nova Conta" para começar.</p>
          </div>
        ) : (
          <>
            {/* Saldo Consolidado */}
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Saldo Consolidado
                </span>
                <span
                  className={cn(
                    "text-2xl font-bold",
                    saldoConsolidado >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {formatCurrency(saldoConsolidado)}
                </span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead className="text-right">Saldo Atual</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {account.is_default && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                        <span className="font-medium">{account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {account.banco ? (
                        <Badge variant="outline">
                          {account.banco}
                          {account.agencia && ` · Ag. ${account.agencia}`}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        account.saldo_atual_centavos >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {formatCurrency(account.saldo_atual_centavos)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAccount(account.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
