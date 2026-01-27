-- Sprint C: A Máquina de Entrega
-- 1. Update projects table with scope tracking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS scope_type text NOT NULL DEFAULT 'fee_mensal',
ADD COLUMN IF NOT EXISTS initial_budget_hours numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_budget_hours numeric NOT NULL DEFAULT 0;

-- Add constraint for scope_type
ALTER TABLE public.projects 
ADD CONSTRAINT projects_scope_type_check 
CHECK (scope_type IN ('horas_fechadas', 'fee_mensal', 'pontual'));

-- 2. Create project_addendums table (Aditivos/Change Orders)
CREATE TABLE public.project_addendums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hours_added NUMERIC NOT NULL DEFAULT 0,
  cost_added_centavos INTEGER NOT NULL DEFAULT 0,
  approved_by_client BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_addendums ENABLE ROW LEVEL SECURITY;

-- RLS Policies for addendums (via project -> client -> organization)
CREATE POLICY "Users can view addendums in their organization"
ON public.project_addendums FOR SELECT
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON p.client_id = c.id
    WHERE c.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can insert addendums in their organization"
ON public.project_addendums FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON p.client_id = c.id
    WHERE c.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can update addendums in their organization"
ON public.project_addendums FOR UPDATE
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON p.client_id = c.id
    WHERE c.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can delete addendums in their organization"
ON public.project_addendums FOR DELETE
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.clients c ON p.client_id = c.id
    WHERE c.organization_id = get_user_organization_id(auth.uid())
  )
);

-- 3. Trigger to auto-update project budget when addendum is created
CREATE OR REPLACE FUNCTION public.update_project_budget_on_addendum()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update current_budget_hours
  UPDATE public.projects
  SET current_budget_hours = current_budget_hours + NEW.hours_added
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_project_budget
AFTER INSERT ON public.project_addendums
FOR EACH ROW
EXECUTE FUNCTION public.update_project_budget_on_addendum();

-- 4. Add SLA tracking fields to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS sla_paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_paused_minutes INTEGER NOT NULL DEFAULT 0;

-- 5. Trigger to track SLA pause time when status changes
CREATE OR REPLACE FUNCTION public.track_task_sla_pause()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When status changes TO "aguardando_cliente", record pause start
  IF NEW.status = 'aguardando_cliente' AND (OLD.status IS NULL OR OLD.status != 'aguardando_cliente') THEN
    NEW.sla_paused_at = now();
  END IF;
  
  -- When status changes FROM "aguardando_cliente", calculate paused time
  IF OLD.status = 'aguardando_cliente' AND NEW.status != 'aguardando_cliente' AND OLD.sla_paused_at IS NOT NULL THEN
    NEW.total_paused_minutes = COALESCE(OLD.total_paused_minutes, 0) + 
      EXTRACT(EPOCH FROM (now() - OLD.sla_paused_at)) / 60;
    NEW.sla_paused_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_track_task_sla
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.track_task_sla_pause();