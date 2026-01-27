-- Adicionar campos de metas financeiras na tabela organizations
ALTER TABLE public.organizations 
ADD COLUMN meta_receita_liquida_centavos integer DEFAULT 0,
ADD COLUMN teto_custos_fixos_centavos integer DEFAULT 0;

-- Permitir que usuários atualizem sua própria organização
CREATE POLICY "Users can update their organization"
ON public.organizations
FOR UPDATE
USING (id = get_user_organization_id(auth.uid()))
WITH CHECK (id = get_user_organization_id(auth.uid()));