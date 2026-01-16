-- ============================================
-- FASE 3.1: HARDENING FINANCEIRO
-- Adiciona campos para modelo caixa vs competência
-- e classificação financeira robusta
-- ============================================

-- 1. Adicionar campo de natureza (operacional vs não operacional)
-- Isso permite classificar despesas que não são operacionais
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS nature text NOT NULL DEFAULT 'operacional';

-- 2. Adicionar campo de data de competência (quando a transação ocorreu contabilmente)
-- A coluna 'date' existente passa a ser a data de vencimento/pagamento
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS competence_date date;

-- 3. Adicionar campo de data de pagamento real (quando foi efetivamente pago/recebido)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_date date;

-- 4. Adicionar campo para classificar como custo direto de projeto ou custo fixo
-- Se project_id for NULL, é custo fixo. Este campo adiciona granularidade
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS cost_type text NOT NULL DEFAULT 'fixo';

-- 5. Atualizar transações existentes para ter competence_date = date
UPDATE public.transactions 
SET competence_date = date 
WHERE competence_date IS NULL;

-- 6. Atualizar transações com payment_date se já estão pagas
UPDATE public.transactions 
SET payment_date = date 
WHERE status = 'pago' AND payment_date IS NULL;

-- 7. Atualizar cost_type baseado em project_id existente
UPDATE public.transactions 
SET cost_type = CASE 
  WHEN project_id IS NOT NULL THEN 'direto'
  ELSE 'fixo'
END;

-- 8. Criar check constraint para validar nature
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_nature_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_nature_check 
CHECK (nature IN ('operacional', 'nao_operacional'));

-- 9. Criar check constraint para validar cost_type
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_cost_type_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_cost_type_check 
CHECK (cost_type IN ('direto', 'fixo'));

-- 10. Criar check constraint para validar type
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('receita', 'despesa'));

-- 11. Criar check constraint para validar status
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado'));

-- 12. Adicionar índices para otimizar queries futuras de DRE
CREATE INDEX IF NOT EXISTS idx_transactions_competence_date 
ON public.transactions(competence_date);

CREATE INDEX IF NOT EXISTS idx_transactions_nature 
ON public.transactions(nature);

CREATE INDEX IF NOT EXISTS idx_transactions_cost_type 
ON public.transactions(cost_type);

CREATE INDEX IF NOT EXISTS idx_transactions_is_repasse 
ON public.transactions(is_repasse);

-- 13. Comentários para documentação
COMMENT ON COLUMN public.transactions.date IS 'Data de vencimento/pagamento prevista';
COMMENT ON COLUMN public.transactions.competence_date IS 'Data de competência contábil (quando a transação ocorreu)';
COMMENT ON COLUMN public.transactions.payment_date IS 'Data de pagamento/recebimento efetivo';
COMMENT ON COLUMN public.transactions.nature IS 'Natureza: operacional ou nao_operacional';
COMMENT ON COLUMN public.transactions.cost_type IS 'Tipo de custo: direto (projeto) ou fixo (agência)';
COMMENT ON COLUMN public.transactions.is_repasse IS 'Se true, é repasse de mídia - não entra em DRE, apenas fluxo de caixa';