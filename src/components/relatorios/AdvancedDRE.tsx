import { useState } from "react";
import { useAdvancedDRE, DRECategory } from "@/hooks/useAdvancedDRE";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DRELineProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  variant?: "income" | "expense" | "repasse" | "highlight" | "neutral" | "result";
  note?: string;
  categories?: DRECategory[];
  isExpanded?: boolean;
  onToggle?: () => void;
  percentual?: number;
}

function DRELine({
  label,
  value,
  icon: Icon,
  variant = "neutral",
  note,
  categories,
  isExpanded,
  onToggle,
  percentual,
}: DRELineProps) {
  const formatCurrency = (cents: number) =>
    `R$ ${(Math.abs(cents) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const variantStyles = {
    income: "text-green-600",
    expense: "text-red-600",
    repasse: "text-muted-foreground bg-muted/50",
    highlight: "font-bold text-primary",
    neutral: "",
    result: value >= 0 ? "text-green-600" : "text-red-600",
  };

  const hasCategories = categories && categories.length > 0;

  return (
    <div className={cn("py-2", variant === "repasse" && "px-3 rounded-lg")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasCategories ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggle}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : Icon ? (
            <Icon className={cn("h-4 w-4", variantStyles[variant])} />
          ) : (
            <div className="w-6" />
          )}
          <div>
            <p className={cn("text-sm", variantStyles[variant])}>{label}</p>
            {note && (
              <p className="text-xs text-muted-foreground">{note}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {percentual !== undefined && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {percentual.toFixed(1)}%
            </span>
          )}
          <span className={cn("text-sm font-semibold tabular-nums", variantStyles[variant])}>
            {value < 0 ? `(${formatCurrency(value)})` : formatCurrency(value)}
          </span>
        </div>
      </div>

      {/* Subcategorias expandíveis */}
      {hasCategories && isExpanded && (
        <div className="ml-9 mt-2 space-y-1 border-l-2 border-muted pl-4">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">{cat.name}</span>
              <span className="text-xs font-medium tabular-nums">
                {formatCurrency(cat.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdvancedDRE() {
  const { dreData, isLoading } = useAdvancedDRE();
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    receita: false,
    variaveis: false,
    fixos: false,
    investimentos: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatCurrency = (cents: number) =>
    `R$ ${(Math.abs(cents) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          DRE Gerencial - Estrutura Contábil Rígida
        </CardTitle>
        <CardDescription>
          Clique nas linhas para expandir categorias (Drill-Down)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* BLOCO 1: RECEITAS */}
        <DRELine
          label="(+) Receita Bruta"
          value={dreData.receitaBruta}
          icon={ArrowUp}
          variant="income"
          categories={dreData.receitaCategories}
          isExpanded={expandedSections.receita}
          onToggle={() => toggleSection("receita")}
        />

        {/* BLOCO 2: IMPOSTOS */}
        <DRELine
          label={`(-) Impostos (${dreData.impostoPercentual}%)`}
          value={-dreData.impostos}
          icon={ArrowDown}
          variant="expense"
          note="Configurável nas configurações"
        />

        {/* BLOCO 3: CUSTOS VARIÁVEIS */}
        <DRELine
          label="(-) Custos Variáveis"
          value={-dreData.custosVariaveis}
          icon={ArrowDown}
          variant="expense"
          note="Comissões, Taxas de Pagamento"
          categories={dreData.custosVariaveisCategories}
          isExpanded={expandedSections.variaveis}
          onToggle={() => toggleSection("variaveis")}
        />

        {/* RESULTADO: MARGEM DE CONTRIBUIÇÃO */}
        <Separator className="my-3" />
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  (=) MARGEM DE CONTRIBUIÇÃO
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  KPI Crítico - Indica capacidade de cobrir custos fixos
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(dreData.margemContribuicao)}
              </p>
              <p className="text-xs text-blue-600">
                {dreData.margemContribuicaoPercent.toFixed(1)}% da Receita
              </p>
            </div>
          </div>
        </div>
        <Separator className="my-3" />

        {/* BLOCO 4: CUSTOS FIXOS */}
        <DRELine
          label="(-) Custos Fixos"
          value={-dreData.custosFixos}
          icon={ArrowDown}
          variant="expense"
          note="Pessoal, Aluguel, Infraestrutura"
          categories={dreData.custosFixosCategories}
          isExpanded={expandedSections.fixos}
          onToggle={() => toggleSection("fixos")}
        />

        {/* BLOCO 5: INVESTIMENTOS */}
        <DRELine
          label="(-) Investimentos"
          value={-dreData.investimentos}
          icon={ArrowDown}
          variant="expense"
          note="Equipamentos, Marketing, Cursos"
          categories={dreData.investimentosCategories}
          isExpanded={expandedSections.investimentos}
          onToggle={() => toggleSection("investimentos")}
        />

        {/* RESULTADO FINAL: LUCRO LÍQUIDO */}
        <Separator className="my-3" />
        <div
          className={cn(
            "p-4 rounded-lg",
            dreData.lucroLiquido >= 0
              ? "bg-green-50 dark:bg-green-950"
              : "bg-red-50 dark:bg-red-950"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dreData.lucroLiquido >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
              <div>
                <p className="text-lg font-bold">
                  (=) LUCRO LÍQUIDO OPERACIONAL
                </p>
                <p className="text-sm text-muted-foreground">
                  Margem Líquida: {dreData.margemLiquida.toFixed(1)}%
                </p>
              </div>
            </div>
            <p
              className={cn(
                "text-3xl font-bold",
                dreData.lucroLiquido >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {dreData.lucroLiquido < 0 && "("}
              {formatCurrency(dreData.lucroLiquido)}
              {dreData.lucroLiquido < 0 && ")"}
            </p>
          </div>
        </div>

        {/* INFO: REPASSES */}
        {dreData.repasses > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Minus className="h-4 w-4" />
                Repasses de Mídia (não contabilizado como receita)
              </span>
              <span className="font-medium">{formatCurrency(dreData.repasses)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
