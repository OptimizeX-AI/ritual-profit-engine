import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useOrganization, MemberFunction } from "@/contexts/OrganizationContext";
import { Info, Loader2, Users, Shield, Briefcase } from "lucide-react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FUNCTION_OPTIONS: { value: MemberFunction; label: string; description: string }[] = [
  { value: "assistente", label: "Assistente", description: "Tarefas, projetos, timesheet" },
  { value: "closer", label: "Closer", description: "+ CRM e War Room" },
  { value: "gestor", label: "Gestor", description: "+ Financeiro e Relatórios" },
  { value: "dono", label: "Dono", description: "Acesso total" },
];

export default function TeamSettings() {
  const { isAdmin, loading: orgLoading } = useOrganization();
  const { members, isLoading, updateMember, isUpdating } = useTeamMembers();
  const queryClient = useQueryClient();
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [updatingFunction, setUpdatingFunction] = useState<string | null>(null);

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFunctionChange = async (memberId: string, newFunction: MemberFunction) => {
    setUpdatingFunction(memberId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ member_function: newFunction })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Função atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    } catch (error) {
      console.error("Error updating function:", error);
      toast.error("Erro ao atualizar função");
    } finally {
      setUpdatingFunction(null);
    }
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
              <CardTitle>Equipe</CardTitle>
            </div>
            <CardDescription>
              Gerencie funções, acessos e custo hora dos colaboradores
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
                    <TableHead className="w-1/3">Membro</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Função
                      </div>
                    </TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={(member as any).avatar_url} alt={member.name} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={(member as any).member_function || "assistente"}
                          onValueChange={(value) => handleFunctionChange(member.id, value as MemberFunction)}
                          disabled={updatingFunction === member.id}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FUNCTION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex flex-col">
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
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

        {/* Access Levels Reference */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Níveis de Acesso por Função</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FUNCTION_OPTIONS.map((option) => (
                <div key={option.value} className="p-3 rounded-lg border bg-muted/30">
                  <Badge variant="secondary" className="mb-2">
                    {option.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
