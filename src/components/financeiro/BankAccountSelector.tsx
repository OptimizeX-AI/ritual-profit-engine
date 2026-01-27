import { useBankAccounts } from "@/hooks/useBankAccounts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";

interface BankAccountSelectorProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  showConsolidated?: boolean;
  label?: string;
  required?: boolean;
}

export function BankAccountSelector({
  value,
  onChange,
  showConsolidated = true,
  label = "Conta Bancária",
  required = false,
}: BankAccountSelectorProps) {
  const { accounts, isLoading } = useBankAccounts();

  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={value || (showConsolidated ? "all" : "")}
        onValueChange={(v) => onChange(v === "all" ? undefined : v)}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma conta..." />
        </SelectTrigger>
        <SelectContent>
          {showConsolidated && (
            <SelectItem value="all">
              <span className="font-medium">📊 Consolidado (Todas as Contas)</span>
            </SelectItem>
          )}
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center justify-between gap-4 w-full">
                <span>
                  {account.is_default && "⭐ "}
                  {account.name}
                  {account.banco && ` (${account.banco})`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(account.saldo_atual_centavos)}
                </span>
              </div>
            </SelectItem>
          ))}
          {accounts.length === 0 && (
            <SelectItem value="_none" disabled>
              Nenhuma conta cadastrada
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
