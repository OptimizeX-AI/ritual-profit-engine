-- =============================================
-- DEALS (CRM Pipeline) - Negócios em andamento
-- =============================================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  contact TEXT,
  value_centavos INTEGER NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  stage TEXT NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  days_in_stage INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deals in their organization" ON public.deals
  FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert deals in their organization" ON public.deals
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update deals in their organization" ON public.deals
  FOR UPDATE USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete deals in their organization" ON public.deals
  FOR DELETE USING (organization_id = get_user_organization_id(auth.uid()));

-- =============================================
-- TRANSACTIONS (Financeiro) - Receitas e Despesas
-- =============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  value_centavos INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  is_repasse BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'atrasado')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions in their organization" ON public.transactions
  FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert transactions in their organization" ON public.transactions
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update transactions in their organization" ON public.transactions
  FOR UPDATE USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete transactions in their organization" ON public.transactions
  FOR DELETE USING (organization_id = get_user_organization_id(auth.uid()));

-- =============================================
-- TASKS (Bíblia/Tarefas) - Gestão de tarefas
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'waiting_approval', 'done', 'late')),
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  estimated_time_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their organization" ON public.tasks
  FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert tasks in their organization" ON public.tasks
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update tasks in their organization" ON public.tasks
  FOR UPDATE USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete tasks in their organization" ON public.tasks
  FOR DELETE USING (organization_id = get_user_organization_id(auth.uid()));

-- =============================================
-- Trigger para atualizar updated_at automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();