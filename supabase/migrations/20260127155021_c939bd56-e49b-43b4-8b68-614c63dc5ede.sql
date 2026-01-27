-- =============================================
-- SPRINT FINANCEIRO AVANÇADO - ERP ELITE
-- =============================================

-- 1. TABELA MULTI-CONTAS BANCÁRIAS
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  saldo_inicial_centavos INTEGER NOT NULL DEFAULT 0,
  saldo_atual_centavos INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies para bank_accounts
CREATE POLICY "Users can view bank accounts in their organization" 
  ON public.bank_accounts FOR SELECT 
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert bank accounts in their organization" 
  ON public.bank_accounts FOR INSERT 
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update bank accounts in their organization" 
  ON public.bank_accounts FOR UPDATE 
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete bank accounts in their organization" 
  ON public.bank_accounts FOR DELETE 
  USING (organization_id = get_user_organization_id(auth.uid()));

-- 2. ADICIONAR CAMPOS DE COMISSÃO EM PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_comissao TEXT DEFAULT 'sobre_faturamento' 
  CHECK (tipo_comissao IN ('sobre_faturamento', 'sobre_margem'));

-- 3. ATUALIZAR TRANSACTIONS COM CAMPOS AVANÇADOS
-- Adicionar bank_account_id (nullable por enquanto para compatibilidade)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- Adicionar campo para vendedor (para rastrear comissões)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS salesperson_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Adicionar campo para comissão provisionada
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS commission_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

-- 4. ADICIONAR CAMPO DE IMPOSTO GLOBAL NA ORGANIZAÇÃO
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS imposto_percentual DECIMAL(5,2) DEFAULT 15.00;

-- 5. CRIAR TABELA DE CATEGORIAS CUSTOMIZÁVEIS
CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  parent_id UUID REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  cost_classification TEXT DEFAULT 'fixo' CHECK (cost_classification IN ('variavel', 'fixo', 'investimento')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS para categories
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories in their organization" 
  ON public.transaction_categories FOR SELECT 
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert categories in their organization" 
  ON public.transaction_categories FOR INSERT 
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update categories in their organization" 
  ON public.transaction_categories FOR UPDATE 
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete categories in their organization" 
  ON public.transaction_categories FOR DELETE 
  USING (organization_id = get_user_organization_id(auth.uid()));

-- 6. TRIGGER PARA ATUALIZAR SALDO DA CONTA BANCÁRIA
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma transação é marcada como paga
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') AND NEW.bank_account_id IS NOT NULL THEN
    IF NEW.type = 'receita' THEN
      UPDATE public.bank_accounts 
      SET saldo_atual_centavos = saldo_atual_centavos + NEW.value_centavos,
          updated_at = now()
      WHERE id = NEW.bank_account_id;
    ELSE
      UPDATE public.bank_accounts 
      SET saldo_atual_centavos = saldo_atual_centavos - NEW.value_centavos,
          updated_at = now()
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  -- Quando uma transação paga é revertida
  IF OLD.status = 'pago' AND NEW.status != 'pago' AND OLD.bank_account_id IS NOT NULL THEN
    IF OLD.type = 'receita' THEN
      UPDATE public.bank_accounts 
      SET saldo_atual_centavos = saldo_atual_centavos - OLD.value_centavos,
          updated_at = now()
      WHERE id = OLD.bank_account_id;
    ELSE
      UPDATE public.bank_accounts 
      SET saldo_atual_centavos = saldo_atual_centavos + OLD.value_centavos,
          updated_at = now()
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS update_bank_balance_on_transaction ON public.transactions;
CREATE TRIGGER update_bank_balance_on_transaction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_account_balance();

-- 7. FUNÇÃO PARA CRIAR COMISSÃO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.calculate_commission(
  deal_value INTEGER,
  salesperson_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  comissao_percent DECIMAL;
  tipo TEXT;
BEGIN
  SELECT comissao_percentual, tipo_comissao INTO comissao_percent, tipo
  FROM public.profiles
  WHERE id = salesperson_id;
  
  IF comissao_percent IS NULL OR comissao_percent = 0 THEN
    RETURN 0;
  END IF;
  
  -- Por padrão, calcular sobre faturamento
  RETURN ROUND(deal_value * (comissao_percent / 100));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;