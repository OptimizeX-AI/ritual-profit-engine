-- ===========================================
-- SPRINT E: BLINDAGEM & ONBOARDING
-- ===========================================

-- =============================================
-- PART 1: SECURITY - Protect custo_hora_centavos
-- =============================================

-- Create a public view that exposes only non-sensitive profile data
-- This will be used by non-admin users instead of querying profiles directly
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  organization_id,
  created_at
  -- OMITS: custo_hora_centavos, comissao_percentual, tipo_comissao, weekly_capacity_hours
FROM public.profiles;

-- Create helper function to check if user can view custo_hora
CREATE OR REPLACE FUNCTION public.can_view_custo_hora()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- =============================================
-- PART 2: Financial Tables - Admin-Only Write
-- =============================================

-- TRANSACTIONS: Keep existing SELECT for all org users, restrict write to admins
DROP POLICY IF EXISTS "Users can insert transactions in their organization" ON public.transactions;
DROP POLICY IF EXISTS "Users can update transactions in their organization" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete transactions in their organization" ON public.transactions;

CREATE POLICY "Admins can insert transactions in their organization" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update transactions in their organization" 
ON public.transactions 
FOR UPDATE 
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete transactions in their organization" 
ON public.transactions 
FOR DELETE 
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- BANK_ACCOUNTS: Admin-only write
DROP POLICY IF EXISTS "Users can insert bank accounts in their organization" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can update bank accounts in their organization" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can delete bank accounts in their organization" ON public.bank_accounts;

CREATE POLICY "Admins can insert bank accounts in their organization" 
ON public.bank_accounts 
FOR INSERT 
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update bank accounts in their organization" 
ON public.bank_accounts 
FOR UPDATE 
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete bank accounts in their organization" 
ON public.bank_accounts 
FOR DELETE 
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- =============================================
-- PART 3: Auto-Seed Categories on Organization Creation
-- =============================================

-- Function to seed default transaction categories for new organizations
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RECEITAS (Revenue categories)
  INSERT INTO public.transaction_categories (organization_id, name, type, cost_classification)
  VALUES
    (NEW.id, 'Fee Mensal (Recorrente)', 'receita', NULL),
    (NEW.id, 'Projeto Pontual', 'receita', NULL),
    (NEW.id, 'Success Fee', 'receita', NULL);

  -- CUSTOS VARIÁVEIS (Variable costs - deducted from margin)
  INSERT INTO public.transaction_categories (organization_id, name, type, cost_classification)
  VALUES
    (NEW.id, 'Impostos (Simples/Presumido)', 'despesa', 'variavel'),
    (NEW.id, 'Comissões de Venda', 'despesa', 'variavel'),
    (NEW.id, 'Taxas Bancárias/Boletos', 'despesa', 'variavel');

  -- CUSTOS DIRETOS (Direct/Project costs)
  INSERT INTO public.transaction_categories (organization_id, name, type, cost_classification)
  VALUES
    (NEW.id, 'Freelancers / Terceirizados', 'despesa', 'variavel'),
    (NEW.id, 'Hospedagem / Servidores do Cliente', 'despesa', 'variavel'),
    (NEW.id, 'Compra de Mídia / Repasse', 'despesa', 'variavel');  -- Note: is_repasse is on transaction, not category

  -- CUSTOS FIXOS (Fixed/Overhead costs)
  INSERT INTO public.transaction_categories (organization_id, name, type, cost_classification)
  VALUES
    (NEW.id, 'Folha de Pagamento', 'despesa', 'fixo'),
    (NEW.id, 'Prolabore Sócios', 'despesa', 'fixo'),
    (NEW.id, 'Aluguel & Infraestrutura', 'despesa', 'fixo'),
    (NEW.id, 'Softwares & Licenças', 'despesa', 'fixo'),
    (NEW.id, 'Marketing da Agência', 'despesa', 'fixo');

  RETURN NEW;
END;
$$;

-- Create trigger to seed categories after organization is created
DROP TRIGGER IF EXISTS trigger_seed_default_categories ON public.organizations;
CREATE TRIGGER trigger_seed_default_categories
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.seed_default_categories();

-- =============================================
-- PART 4: Update profiles table for admin check
-- =============================================

-- Ensure admins can update any profile in their org (for team settings)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update profiles in their organization" 
ON public.profiles 
FOR UPDATE 
USING (
  id = auth.uid() 
  OR (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
  )
);