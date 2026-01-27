-- =============================================
-- SPRINT B: CRM Profissional & War Room Cirúrgico
-- =============================================

-- 1. ATUALIZAÇÃO DA TABELA DEALS (CRM)
-- Adicionar origem do lead, motivo de perda e data esperada de fechamento
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'organic',
ADD COLUMN IF NOT EXISTS loss_reason TEXT,
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS salesperson_id UUID REFERENCES public.profiles(id);

-- Constraint para validar origem
ALTER TABLE public.deals 
ADD CONSTRAINT deals_origin_check 
CHECK (origin IN ('ads', 'indicacao', 'outbound', 'organic'));

-- 2. TABELA MONTHLY_GOALS (Metas Mensais)
CREATE TABLE IF NOT EXISTS public.monthly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Formato: 'YYYY-MM'
  type TEXT NOT NULL CHECK (type IN ('faturamento', 'leads', 'vendas_qtd')),
  target_value_centavos INTEGER NOT NULL DEFAULT 0,
  achieved_value_centavos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, month, type)
);

-- Enable RLS
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_goals
CREATE POLICY "Users can view goals in their organization"
ON public.monthly_goals FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can insert goals in their organization"
ON public.monthly_goals FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update goals in their organization"
ON public.monthly_goals FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete goals in their organization"
ON public.monthly_goals FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_monthly_goals_updated_at
BEFORE UPDATE ON public.monthly_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. FUNÇÃO PARA PROVISIONAR COMISSÃO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.provision_sales_commission(
  p_deal_id UUID,
  p_deal_value INTEGER,
  p_salesperson_id UUID,
  p_organization_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commission_amount INTEGER;
  new_transaction_id UUID;
BEGIN
  -- Calcular comissão usando a função existente
  commission_amount := calculate_commission(p_deal_value, p_salesperson_id);
  
  IF commission_amount > 0 THEN
    -- Criar transação de despesa provisionada
    INSERT INTO public.transactions (
      organization_id,
      description,
      category,
      type,
      value_centavos,
      status,
      nature,
      cost_type,
      salesperson_id,
      notes
    ) VALUES (
      p_organization_id,
      'Comissão de Vendas - Deal #' || LEFT(p_deal_id::TEXT, 8),
      'Comissões de Vendas',
      'despesa',
      commission_amount,
      'pendente',
      'operacional',
      'variavel',
      p_salesperson_id,
      'Comissão provisionada automaticamente ao fechar negócio'
    )
    RETURNING id INTO new_transaction_id;
    
    RETURN new_transaction_id;
  END IF;
  
  RETURN NULL;
END;
$$;