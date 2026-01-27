import { useState } from "react";
import { useMonthlyGoals, GoalType } from "@/hooks/useMonthlyGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Target, Plus, Loader2, Trash2 } from "lucide-react";

const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: "faturamento", label: "Faturamento (R$)" },
  { value: "leads", label: "Leads (Quantidade)" },
  { value: "vendas_qtd", label: "Vendas (Quantidade)" },
];

export function GoalsManager() {
  const {
    currentMonthGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    isCreating,
    isUpdating,
    canManage,
  } = useMonthlyGoals();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: "faturamento" as GoalType,
    target: 0,
  });

  const currentMonth = new Date().toISOString().slice(0, 7);

  const handleCreate = () => {
    createGoal({
      month: currentMonth,
      type: newGoal.type,
      target_value_centavos:
        newGoal.type === "faturamento"
          ? Math.round(newGoal.target * 100)
          : newGoal.target,
    });
    setDialogOpen(false);
    setNewGoal({ type: "faturamento", target: 0 });
  };

  const existingTypes = currentMonthGoals.map((g) => g.type);
  const availableTypes = GOAL_TYPES.filter(
    (t) => !existingTypes.includes(t.value)
  );

  if (!canManage) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Gerenciar Metas
          </div>
          {availableTypes.length > 0 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Meta do Mês</DialogTitle>
                  <DialogDescription>
                    Defina uma meta para{" "}
                    {new Date().toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                    .
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo de Meta</Label>
                    <Select
                      value={newGoal.type}
                      onValueChange={(v) =>
                        setNewGoal({ ...newGoal, type: v as GoalType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {newGoal.type === "faturamento"
                        ? "Valor (R$)"
                        : "Quantidade"}
                    </Label>
                    <Input
                      type="number"
                      value={newGoal.target || ""}
                      onChange={(e) =>
                        setNewGoal({
                          ...newGoal,
                          target: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder={
                        newGoal.type === "faturamento" ? "100000" : "10"
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !newGoal.target}
                  >
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar Meta
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentMonthGoals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma meta definida para este mês.
          </p>
        ) : (
          <div className="space-y-2">
            {currentMonthGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <span className="font-medium text-sm">
                    {GOAL_TYPES.find((t) => t.value === goal.type)?.label}
                  </span>
                  <div className="text-lg font-semibold">
                    {goal.type === "faturamento"
                      ? `R$ ${(goal.target_value_centavos / 100).toLocaleString(
                          "pt-BR"
                        )}`
                      : goal.target_value_centavos.toLocaleString("pt-BR")}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteGoal(goal.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
