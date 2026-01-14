import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, MoreHorizontal, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients, Client, CreateClientInput } from "@/hooks/useClients";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Clientes() {
  const { clients, isLoading, createClient, deleteClient, isCreating, isDeleting } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<CreateClientInput>({
    name: "",
    fee_mensal_centavos: 0,
    contrato_inicio: "",
    contrato_fim: "",
  });

  const formatCurrency = (valueInCents: number | null) => {
    if (valueInCents === null) return "R$ 0,00";
    return (valueInCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getClientStatus = (client: Client) => {
    if (client.contrato_fim && new Date(client.contrato_fim) < new Date()) {
      return "churned";
    }
    return "active";
  };

  const statusConfig = {
    active: { label: "Ativo", className: "bg-profit/10 text-profit border-profit/20" },
    churned: { label: "Cancelado", className: "bg-loss/10 text-loss border-loss/20" },
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = () => {
    if (!newClient.name) return;

    createClient({
      name: newClient.name,
      fee_mensal_centavos: newClient.fee_mensal_centavos,
      contrato_inicio: newClient.contrato_inicio || undefined,
      contrato_fim: newClient.contrato_fim || undefined,
    });

    setNewClient({ name: "", fee_mensal_centavos: 0, contrato_inicio: "", contrato_fim: "" });
    setDialogOpen(false);
  };

  const activeCount = filteredClients.filter((c) => getClientStatus(c) === "active").length;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Contratos, fees e rentabilidade</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Adicione um novo cliente à sua carteira.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Cliente</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Ex: Empresa ABC Ltda"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Fee Mensal (R$)</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={(newClient.fee_mensal_centavos || 0) / 100}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        fee_mensal_centavos: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    placeholder="0,00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inicio">Início do Contrato</Label>
                    <Input
                      id="inicio"
                      type="date"
                      value={newClient.contrato_inicio}
                      onChange={(e) =>
                        setNewClient({ ...newClient, contrato_inicio: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fim">Fim do Contrato</Label>
                    <Input
                      id="fim"
                      type="date"
                      value={newClient.contrato_fim}
                      onChange={(e) =>
                        setNewClient({ ...newClient, contrato_fim: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateClient} disabled={isCreating || !newClient.name}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Cliente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-profit" />
            {activeCount} ativos
          </Badge>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">Nenhum cliente encontrado</p>
              <p className="text-sm text-muted-foreground">
                Clique em "Novo Cliente" para adicionar o primeiro.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fee Mensal</TableHead>
                  <TableHead>Início Contrato</TableHead>
                  <TableHead>Fim Contrato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const status = getClientStatus(client);

                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{formatCurrency(client.fee_mensal_centavos)}</TableCell>
                      <TableCell>{formatDate(client.contrato_inicio)}</TableCell>
                      <TableCell>{formatDate(client.contrato_fim)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[status].className}>
                          {statusConfig[status].label}
                        </Badge>
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
                              onClick={() => deleteClient(client.id)}
                              disabled={isDeleting}
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
      </div>
    </MainLayout>
  );
}
