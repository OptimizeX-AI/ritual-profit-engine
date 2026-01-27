-- =============================================
-- SPRINT D: Central de Notificações e Capacidade
-- =============================================

-- 1. TABELA DE NOTIFICAÇÕES
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- 2. ADICIONAR CAMPO DE CAPACIDADE SEMANAL AOS PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weekly_capacity_hours INTEGER DEFAULT 40;

-- 3. FUNÇÃO PARA CRIAR NOTIFICAÇÃO DE BUDGET 90%
CREATE OR REPLACE FUNCTION public.check_project_budget_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_rec RECORD;
  consumed_hours NUMERIC;
  budget_percent NUMERIC;
  org_id UUID;
  admin_users UUID[];
BEGIN
  -- Buscar dados do projeto
  SELECT p.*, c.organization_id 
  INTO project_rec 
  FROM projects p
  JOIN clients c ON p.client_id = c.id
  WHERE p.id = NEW.project_id;
  
  IF project_rec.id IS NULL OR project_rec.current_budget_hours <= 0 THEN
    RETURN NEW;
  END IF;
  
  org_id := project_rec.organization_id;
  
  -- Calcular horas consumidas
  SELECT COALESCE(SUM(time_spent_minutes) / 60.0, 0)
  INTO consumed_hours
  FROM tasks
  WHERE project_id = NEW.project_id;
  
  budget_percent := (consumed_hours / project_rec.current_budget_hours) * 100;
  
  -- Se atingiu 90%, criar notificação para admins
  IF budget_percent >= 90 AND budget_percent < 110 THEN
    -- Buscar admins da organização
    SELECT ARRAY_AGG(ur.user_id)
    INTO admin_users
    FROM user_roles ur
    JOIN profiles pr ON ur.user_id = pr.id
    WHERE pr.organization_id = org_id AND ur.role = 'admin';
    
    -- Criar notificação para cada admin (se não existir uma recente)
    IF admin_users IS NOT NULL THEN
      INSERT INTO notifications (organization_id, user_id, title, message, link, type)
      SELECT 
        org_id,
        u,
        'Alerta de Budget',
        'Projeto "' || project_rec.name || '" atingiu ' || ROUND(budget_percent) || '% do budget de horas.',
        '/projetos/' || project_rec.id,
        'warning'
      FROM unnest(admin_users) AS u
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = u 
          AND n.link = '/projetos/' || project_rec.id
          AND n.title = 'Alerta de Budget'
          AND n.created_at > NOW() - INTERVAL '1 day'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para alertar sobre budget ao atualizar tempo gasto em tarefas
DROP TRIGGER IF EXISTS check_budget_on_task_update ON tasks;
CREATE TRIGGER check_budget_on_task_update
AFTER UPDATE OF time_spent_minutes ON tasks
FOR EACH ROW
WHEN (NEW.project_id IS NOT NULL AND NEW.time_spent_minutes != OLD.time_spent_minutes)
EXECUTE FUNCTION check_project_budget_alert();

-- 4. FUNÇÃO PARA CRIAR NOTIFICAÇÃO DE TAREFA ATRASADA
CREATE OR REPLACE FUNCTION public.check_overdue_tasks_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Se a tarefa passou do prazo e não está concluída nem aguardando cliente
  IF NEW.deadline IS NOT NULL 
     AND NEW.deadline < CURRENT_DATE 
     AND NEW.status NOT IN ('done', 'waiting_approval')
     AND NEW.assignee_id IS NOT NULL THEN
    
    -- Buscar organization_id
    org_id := NEW.organization_id;
    
    -- Criar notificação para o responsável (se não existir uma recente)
    INSERT INTO notifications (organization_id, user_id, title, message, link, type)
    SELECT 
      org_id,
      NEW.assignee_id,
      'Tarefa Atrasada',
      'A tarefa "' || NEW.title || '" está atrasada desde ' || TO_CHAR(NEW.deadline, 'DD/MM/YYYY') || '.',
      '/tarefas',
      'warning'
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = NEW.assignee_id 
        AND n.message LIKE '%' || NEW.title || '%'
        AND n.title = 'Tarefa Atrasada'
        AND n.created_at > NOW() - INTERVAL '1 day'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para verificar tarefas atrasadas
DROP TRIGGER IF EXISTS check_overdue_on_task_update ON tasks;
CREATE TRIGGER check_overdue_on_task_update
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN (NEW.deadline IS NOT NULL AND NEW.deadline < CURRENT_DATE)
EXECUTE FUNCTION check_overdue_tasks_notification();

-- 5. FUNÇÃO PARA NOTIFICAR QUANDO TAREFA É ATRIBUÍDA
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se foi atribuído um novo responsável
  IF NEW.assignee_id IS NOT NULL 
     AND (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
    
    INSERT INTO notifications (organization_id, user_id, title, message, link, type)
    VALUES (
      NEW.organization_id,
      NEW.assignee_id,
      'Nova Tarefa Atribuída',
      'Você foi marcado na tarefa "' || NEW.title || '".',
      '/tarefas',
      'info'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar atribuição
DROP TRIGGER IF EXISTS notify_on_task_assignment ON tasks;
CREATE TRIGGER notify_on_task_assignment
AFTER INSERT OR UPDATE OF assignee_id ON tasks
FOR EACH ROW
WHEN (NEW.assignee_id IS NOT NULL)
EXECUTE FUNCTION notify_task_assignment();

-- 6. FUNÇÃO PARA NOTIFICAR NOVO ADITIVO
CREATE OR REPLACE FUNCTION public.notify_new_addendum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_rec RECORD;
  org_id UUID;
  admin_users UUID[];
BEGIN
  -- Buscar dados do projeto
  SELECT p.name, c.organization_id 
  INTO project_rec 
  FROM projects p
  JOIN clients c ON p.client_id = c.id
  WHERE p.id = NEW.project_id;
  
  IF project_rec IS NULL THEN
    RETURN NEW;
  END IF;
  
  org_id := project_rec.organization_id;
  
  -- Buscar admins da organização
  SELECT ARRAY_AGG(ur.user_id)
  INTO admin_users
  FROM user_roles ur
  JOIN profiles pr ON ur.user_id = pr.id
  WHERE pr.organization_id = org_id AND ur.role = 'admin';
  
  -- Criar notificação para cada admin
  IF admin_users IS NOT NULL THEN
    INSERT INTO notifications (organization_id, user_id, title, message, link, type)
    SELECT 
      org_id,
      u,
      'Novo Aditivo Criado',
      'Aditivo de ' || NEW.hours_added || 'h criado para o projeto "' || project_rec.name || '".',
      '/projetos/' || NEW.project_id,
      'info'
    FROM unnest(admin_users) AS u;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar novo aditivo
DROP TRIGGER IF EXISTS notify_on_new_addendum ON project_addendums;
CREATE TRIGGER notify_on_new_addendum
AFTER INSERT ON project_addendums
FOR EACH ROW
EXECUTE FUNCTION notify_new_addendum();