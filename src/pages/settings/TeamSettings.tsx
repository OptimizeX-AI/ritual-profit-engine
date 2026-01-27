import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Info, Loader2, Users } from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

export default function TeamSettings() {
  const { isAdmin, loading: orgLoading } = useOrganization();
  const { members, isLoading, updateMember, isUpdating } = useTeamMembers();
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Protect route - only admins can access
  if (!orgLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const formatCurrencyInput = (centavos: number | null): string => {
    if (centavos === null || centavos === 0) return "";
    return (centavos / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyInput = (value: string): number => {
    // Remove non-numeric characters except comma and dot
    const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  };

  const handleValueChange = (memberId: string, value: string) => {
    setEditingValues((prev) => ({ ...prev, [memberId]: value }));
  };

  const handleBlur = (memberId: string) => {
    const inputValue = editingValues[memberId];
    if (inputValue === undefined) return;

    const centavos = parseCurrencyInput(inputValue);
    const member = members.find((m) => m.id === memberId);
    
    // Only update if value changed
    if (member && member.custo_hora_centavos !== centavos) {
      updateMember({ id: memberId, custo_hora_centavos: centavos });
    }

    // Clear editing state
    setEditingValues((prev) => {
      const newState = { ...prev };
      delete newState[memberId];
      return newState;
    });
  };

  const getDisplayValue = (member: { id: string; custo_hora_centavos: number | null }) => {
    if (editingValues[member.id] !== undefined) {
      return editingValues[member.id];
    }
    return formatCurrencyInput(member.custo_hora_centavos);
  };

  if (isLoading || orgLoading) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Time</h1>
          <p className="text-muted-foreground">
            Configure o custo hora de cada membro da equipe
          </p>
        </div>

        {/* Team Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Custo Hora da Equipe</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>Custo Hora</strong> = (Salário + Impostos + Benefícios) / 160h
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>
              Este valor é usado para calcular o custo de pessoal nos projetos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum membro encontrado na organização.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Nome</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Custo Hora (R$)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              Custo Hora = (Salário + Impostos + Benefícios) / 160h
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <span className="text-muted-foreground">R$</span>
                          <Input
                            type="text"
                            placeholder="0,00"
                            value={getDisplayValue(member)}
                            onChange={(e) => handleValueChange(member.id, e.target.value)}
                            onBlur={() => handleBlur(member.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-32"
                            disabled={isUpdating}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
