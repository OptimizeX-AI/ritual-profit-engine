import { useMemo } from "react";
import { useTransactions } from "./useTransactions";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface DRECategory {
  name: string;
  value: number;
  subcategories?: { name: string; value: number }[];
}

export interface DREData {
  // Linha 1: Receita Bruta
  receitaBruta: number;
  receitaCategories: DRECategory[];
  
  // Linha 2: Impostos
  impostos: number;
  impostoPercentual: number;
  
  // Linha 3: Custos Variáveis
  custosVariaveis: number;
  custosVariaveisCategories: DRECategory[];
  
  // Linha 4: Margem de Contribuição
  margemContribuicao: number;
  margemContribuicaoPercent: number;
  
  // Linha 5: Custos Fixos
  custosFixos: number;
  custosFixosCategories: DRECategory[];
  
  // Linha 6: Investimentos
  investimentos: number;
  investimentosCategories: DRECategory[];
  
  // Linha 7: Lucro Líquido Operacional
  lucroLiquido: number;
  margemLiquida: number;
  
  // Repasses (não contam como receita)
  repasses: number;
}

// Categorias de custos variáveis
const CATEGORIAS_VARIAVEIS = [
  "Comissões de Vendas",
  "Impostos sobre Serviços",
  "Taxas de Boleto",
  "Taxas de Cartão",
  "Taxas Bancárias",
  "Custos de Mídia (Operacional)",
];

// Categorias de investimentos
const CATEGORIAS_INVESTIMENTO = [
  "Equipamentos",
  "Marketing Institucional",
  "Cursos e Treinamentos",
  "Ferramentas e Softwares",
];

export function useAdvancedDRE() {
  const { transactions, totalRepasses, isLoading } = useTransactions();
  const { organization } = useOrganization();
  
  const impostoPercentual = organization?.imposto_percentual ?? 15;

  const dreData = useMemo((): DREData => {
    // ========================================
    // 1. RECEITA BRUTA (excluindo repasses)
    // ========================================
    const receitaTransactions = transactions.filter(
      (t) => t.type === "receita" && !t.is_repasse
    );
    const receitaBruta = receitaTransactions.reduce(
      (sum, t) => sum + t.value_centavos,
      0
    );

    // Agrupar receitas por categoria
    const receitaCategoryMap = new Map<string, number>();
    receitaTransactions.forEach((t) => {
      const current = receitaCategoryMap.get(t.category) || 0;
      receitaCategoryMap.set(t.category, current + t.value_centavos);
    });
    const receitaCategories: DRECategory[] = Array.from(receitaCategoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ========================================
    // 2. IMPOSTOS (% configurável)
    // ========================================
    const impostos = Math.round(receitaBruta * (impostoPercentual / 100));

    // ========================================
    // 3. CUSTOS VARIÁVEIS
    // ========================================
    const custosVariaveisTransactions = transactions.filter(
      (t) =>
        t.type === "despesa" &&
        !t.is_repasse &&
        CATEGORIAS_VARIAVEIS.includes(t.category)
    );
    const custosVariaveis = custosVariaveisTransactions.reduce(
      (sum, t) => sum + t.value_centavos,
      0
    );

    // Agrupar por categoria
    const cvCategoryMap = new Map<string, number>();
    custosVariaveisTransactions.forEach((t) => {
      const current = cvCategoryMap.get(t.category) || 0;
      cvCategoryMap.set(t.category, current + t.value_centavos);
    });
    const custosVariaveisCategories: DRECategory[] = Array.from(cvCategoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ========================================
    // 4. MARGEM DE CONTRIBUIÇÃO
    // ========================================
    const margemContribuicao = receitaBruta - impostos - custosVariaveis;
    const margemContribuicaoPercent =
      receitaBruta > 0 ? (margemContribuicao / receitaBruta) * 100 : 0;

    // ========================================
    // 5. CUSTOS FIXOS
    // ========================================
    const custosFixosTransactions = transactions.filter(
      (t) =>
        t.type === "despesa" &&
        !t.is_repasse &&
        !CATEGORIAS_VARIAVEIS.includes(t.category) &&
        !CATEGORIAS_INVESTIMENTO.includes(t.category)
    );
    const custosFixos = custosFixosTransactions.reduce(
      (sum, t) => sum + t.value_centavos,
      0
    );

    // Agrupar por categoria
    const cfCategoryMap = new Map<string, number>();
    custosFixosTransactions.forEach((t) => {
      const current = cfCategoryMap.get(t.category) || 0;
      cfCategoryMap.set(t.category, current + t.value_centavos);
    });
    const custosFixosCategories: DRECategory[] = Array.from(cfCategoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ========================================
    // 6. INVESTIMENTOS
    // ========================================
    const investimentosTransactions = transactions.filter(
      (t) =>
        t.type === "despesa" &&
        !t.is_repasse &&
        CATEGORIAS_INVESTIMENTO.includes(t.category)
    );
    const investimentos = investimentosTransactions.reduce(
      (sum, t) => sum + t.value_centavos,
      0
    );

    // Agrupar por categoria
    const invCategoryMap = new Map<string, number>();
    investimentosTransactions.forEach((t) => {
      const current = invCategoryMap.get(t.category) || 0;
      invCategoryMap.set(t.category, current + t.value_centavos);
    });
    const investimentosCategories: DRECategory[] = Array.from(invCategoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ========================================
    // 7. LUCRO LÍQUIDO OPERACIONAL
    // ========================================
    const lucroLiquido = margemContribuicao - custosFixos - investimentos;
    const margemLiquida =
      receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

    return {
      receitaBruta,
      receitaCategories,
      impostos,
      impostoPercentual,
      custosVariaveis,
      custosVariaveisCategories,
      margemContribuicao,
      margemContribuicaoPercent,
      custosFixos,
      custosFixosCategories,
      investimentos,
      investimentosCategories,
      lucroLiquido,
      margemLiquida,
      repasses: totalRepasses,
    };
  }, [transactions, totalRepasses, impostoPercentual]);

  return {
    dreData,
    isLoading,
  };
}
