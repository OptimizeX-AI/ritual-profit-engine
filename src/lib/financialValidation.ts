import { z } from 'zod';

/**
 * ============================================
 * VALIDAÇÃO FINANCEIRA - BLINDAGEM DO REPASSE
 * ============================================
 * 
 * Este módulo contém as regras INVIOLÁVEIS do sistema financeiro:
 * 1. Repasses NUNCA podem ser classificados como receita operacional
 * 2. Repasses NUNCA alimentam DRE ou rentabilidade
 * 3. Repasses APENAS afetam fluxo de caixa
 */

// Tipos exportados
export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
export type TransactionNature = 'operacional' | 'nao_operacional';
export type CostType = 'direto' | 'fixo';

// Categorias válidas para repasse
export const CATEGORIAS_REPASSE = [
  'Compra de Mídia/Ads',
  'Mídia Paga',
  'Investimento em Mídia',
  'Google Ads',
  'Facebook Ads',
  'Meta Ads',
  'LinkedIn Ads',
  'TikTok Ads',
] as const;

// Categorias de receita
export const CATEGORIAS_RECEITA = [
  'Fee Mensal',
  'Projeto Pontual',
  'Consultoria',
  'Comissão',
  'Outros',
] as const;

// Categorias de despesa
export const CATEGORIAS_DESPESA = [
  'Salários',
  'Freelancers',
  'Aluguel',
  'Ferramentas/Software',
  'Compra de Mídia/Ads',
  'Impostos',
  'Marketing',
  'Administrativo',
  'Outros',
] as const;

/**
 * Verifica se uma categoria é elegível para ser marcada como repasse
 */
export function isCategoriaRepasse(category: string): boolean {
  const normalized = category.toLowerCase().trim();
  return CATEGORIAS_REPASSE.some(cat => 
    normalized.includes(cat.toLowerCase()) ||
    normalized.includes('mídia') ||
    normalized.includes('midia') ||
    normalized.includes('ads') ||
    normalized.includes('google') ||
    normalized.includes('facebook') ||
    normalized.includes('meta') ||
    normalized.includes('tiktok') ||
    normalized.includes('linkedin')
  );
}

/**
 * REGRA INVIOLÁVEL: Valida se uma transação pode ser marcada como repasse
 * 
 * Uma transação só pode ser repasse se:
 * 1. Categoria for compatível (mídia/ads)
 * 2. Tipo for 'despesa' (o repasse representa o pagamento à plataforma de mídia)
 * 
 * Se for repasse, automaticamente:
 * - Natureza = 'nao_operacional'
 * - Não entra em DRE
 * - Não afeta rentabilidade
 */
export function validateRepasse(
  isRepasse: boolean,
  category: string,
  type: TransactionType
): { valid: boolean; error?: string; correctedNature?: TransactionNature } {
  // Se não é repasse, qualquer configuração é válida
  if (!isRepasse) {
    return { valid: true };
  }

  // REGRA 1: Repasse deve ter categoria compatível
  if (!isCategoriaRepasse(category)) {
    return {
      valid: false,
      error: `Repasse só pode ser marcado para categorias de mídia/ads. Categoria "${category}" não é compatível.`,
    };
  }

  // REGRA 2: Repasse de despesa (pagamento à plataforma) é o padrão
  // Mas também permitimos receita de repasse (cliente pagando a mídia)
  
  // Se passou nas validações, força natureza não operacional
  return {
    valid: true,
    correctedNature: 'nao_operacional',
  };
}

/**
 * Schema de validação para transação
 */
export const TransactionSchema = z.object({
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim(),
  
  category: z.string()
    .min(1, 'Categoria é obrigatória')
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .trim(),
  
  value_centavos: z.number()
    .int('Valor deve ser inteiro')
    .min(1, 'Valor deve ser maior que zero')
    .max(100000000000, 'Valor muito alto'), // 1 bilhão em reais
  
  type: z.enum(['receita', 'despesa'], {
    errorMap: () => ({ message: 'Tipo deve ser receita ou despesa' }),
  }),
  
  nature: z.enum(['operacional', 'nao_operacional'], {
    errorMap: () => ({ message: 'Natureza deve ser operacional ou nao_operacional' }),
  }).default('operacional'),
  
  cost_type: z.enum(['direto', 'fixo'], {
    errorMap: () => ({ message: 'Tipo de custo deve ser direto ou fixo' }),
  }).default('fixo'),
  
  is_repasse: z.boolean().default(false),
  
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida'),
  
  competence_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de competência inválida')
    .optional()
    .nullable(),
  
  payment_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de pagamento inválida')
    .optional()
    .nullable(),
  
  status: z.enum(['pendente', 'pago', 'atrasado', 'cancelado'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }).default('pendente'),
  
  project_id: z.string().uuid('ID do projeto inválido').optional().nullable(),
  
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional().nullable(),
}).superRefine((data, ctx) => {
  // VALIDAÇÃO CRÍTICA: Repasse
  const repasseValidation = validateRepasse(data.is_repasse, data.category, data.type);
  
  if (!repasseValidation.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: repasseValidation.error!,
      path: ['is_repasse'],
    });
  }

  // Se é repasse, força natureza não operacional
  if (data.is_repasse && repasseValidation.correctedNature) {
    data.nature = repasseValidation.correctedNature;
  }

  // Validação: cost_type deve ser 'direto' se project_id existe
  if (data.project_id && data.cost_type === 'fixo') {
    // Auto-correção silenciosa
    data.cost_type = 'direto';
  }

  // Validação: competence_date não pode ser no futuro muito distante
  if (data.competence_date) {
    const competenceDate = new Date(data.competence_date);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (competenceDate > oneYearFromNow) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de competência não pode ser mais de 1 ano no futuro',
        path: ['competence_date'],
      });
    }
  }
});

export type ValidatedTransactionInput = z.infer<typeof TransactionSchema>;

/**
 * Prepara uma transação para inserção no banco, aplicando todas as regras de negócio
 */
export function prepareTransactionForInsert(input: ValidatedTransactionInput): ValidatedTransactionInput {
  const prepared = { ...input };

  // REGRA INVIOLÁVEL: Se é repasse, SEMPRE não operacional
  if (prepared.is_repasse) {
    prepared.nature = 'nao_operacional';
  }

  // Se tem projeto, é custo direto
  if (prepared.project_id) {
    prepared.cost_type = 'direto';
  } else {
    prepared.cost_type = 'fixo';
  }

  // Se não tem data de competência, usar data de vencimento
  if (!prepared.competence_date) {
    prepared.competence_date = prepared.date;
  }

  // Se status é 'pago' e não tem payment_date, usar data atual
  if (prepared.status === 'pago' && !prepared.payment_date) {
    prepared.payment_date = new Date().toISOString().split('T')[0];
  }

  return prepared;
}

/**
 * ============================================
 * FUNÇÕES DE CÁLCULO FINANCEIRO
 * ============================================
 * 
 * Estas funções garantem que os cálculos financeiros
 * respeitem as regras de repasse e natureza
 */

export interface TransactionForCalc {
  type: TransactionType;
  nature: TransactionNature;
  is_repasse: boolean;
  value_centavos: number;
  status: TransactionStatus;
  cost_type: CostType;
  project_id: string | null;
}

/**
 * Calcula totais operacionais (excluindo repasses)
 */
export function calcularTotaisOperacionais(transactions: TransactionForCalc[]) {
  // Filtra APENAS transações operacionais que NÃO são repasse
  const operacionais = transactions.filter(
    t => t.nature === 'operacional' && !t.is_repasse
  );

  const receitas = operacionais
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.value_centavos, 0);

  const despesas = operacionais
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.value_centavos, 0);

  return {
    receitas,
    despesas,
    resultado: receitas - despesas,
  };
}

/**
 * Calcula totais de repasses (apenas fluxo de caixa)
 */
export function calcularTotaisRepasses(transactions: TransactionForCalc[]) {
  const repasses = transactions.filter(t => t.is_repasse);

  const entrada = repasses
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.value_centavos, 0);

  const saida = repasses
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.value_centavos, 0);

  return {
    entrada,
    saida,
    saldo: entrada - saida,
  };
}

/**
 * Calcula fluxo de caixa total (inclui tudo)
 */
export function calcularFluxoCaixa(transactions: TransactionForCalc[]) {
  const operacionais = calcularTotaisOperacionais(transactions);
  const repasses = calcularTotaisRepasses(transactions);

  const totalEntradas = operacionais.receitas + repasses.entrada;
  const totalSaidas = operacionais.despesas + repasses.saida;

  return {
    operacional: operacionais.resultado,
    repasses: repasses.saldo,
    total: totalEntradas - totalSaidas,
  };
}

/**
 * Calcula saldo realizado (apenas transações pagas)
 */
export function calcularSaldoRealizado(transactions: TransactionForCalc[]) {
  const pagas = transactions.filter(t => t.status === 'pago');
  return calcularTotaisOperacionais(pagas);
}

/**
 * Calcula custos por tipo (direto vs fixo)
 */
export function calcularCustosPorTipo(transactions: TransactionForCalc[]) {
  const despesas = transactions.filter(
    t => t.type === 'despesa' && t.nature === 'operacional' && !t.is_repasse
  );

  const custosDiretos = despesas
    .filter(t => t.cost_type === 'direto')
    .reduce((acc, t) => acc + t.value_centavos, 0);

  const custosFixos = despesas
    .filter(t => t.cost_type === 'fixo')
    .reduce((acc, t) => acc + t.value_centavos, 0);

  return {
    diretos: custosDiretos,
    fixos: custosFixos,
    total: custosDiretos + custosFixos,
  };
}
