

# Curso de Uso do Sistema - Nova Pagina `/curso`

## Objetivo
Criar uma pagina dedicada dentro do sistema que funcione como um **curso interativo de uso**, guiando o usuario pelas fases logicas de implantacao e operacao do Agency Profit Planner. O conteudo sera extraido integralmente do `plan.md` e organizado em fases sequenciais com accordions expansiveis.

## O Que Sera Construido

Uma pagina `/curso` acessivel por todos os usuarios (ProtectedRoute, nao AdminRoute), com um link na Sidebar (icone `GraduationCap`). A pagina apresenta o conteudo em **6 Fases Logicas**, cada uma com sub-licoes em accordions.

---

## Estrutura das Fases

### Fase 1 - Configuracao Inicial (Fundacao)
- Criar sua conta e entender o onboarding
- Configurar equipe em `/settings/team` (custo hora, funcoes, comissoes)
- Cadastrar contas bancarias no Financeiro
- O plano de contas Baker ja vem pronto automaticamente

### Fase 2 - Captacao e Vendas (CRM)
- Como criar deals no pipeline Kanban
- Registrar origem do lead (ads, indicacao, outbound, organic)
- Mover deals entre colunas (Prospeccao → Proposta → Negociacao)
- Fechar deal: comissao automatica + wizard de criacao de projeto
- Registrar motivo de perda obrigatorio

### Fase 3 - Entrega e Operacao (Projetos + Tarefas)
- Entender o projeto criado: budget inicial e fuel gauge
- Criar tarefas com dono, prazo e descricao obrigatorios
- Usar o timesheet para registrar horas trabalhadas
- Entender a pausa de SLA (aguardando cliente)
- Solicitar aditivos quando o escopo muda
- Monitorar capacidade da equipe em `/capacidade`

### Fase 4 - Gestao Financeira
- Lancar receitas e despesas operacionais
- Entender a regra de Repasse (midia que nao e receita propria)
- Diferenca entre custo direto (vinculado a projeto) e custo fixo
- Como o saldo bancario atualiza automaticamente ao pagar

### Fase 5 - Inteligencia e Relatorios
- Ler o DRE Gerencial de 7 linhas
- Entender a formula de rentabilidade por cliente
- Usar drill-down por categoria no DRE

### Fase 6 - Rituais de Gestao (War Room)
- Definir metas mensais (faturamento, vendas, pipeline)
- Acompanhar ranking de vendedores
- Usar o Churn Radar para renovar contratos a tempo

---

## Implementacao Tecnica

### Arquivos a criar
1. **`src/pages/Curso.tsx`** - Pagina principal com as 6 fases usando Accordion do Shadcn/UI. Cada fase tem:
   - Numero e titulo da fase
   - Badge de progresso (ex: "6 licoes")
   - Accordion com sub-licoes contendo texto explicativo, dicas praticas e links para a rota relevante (ex: "Ir para CRM →")
   - Cards com icones contextuais (AlertTriangle para regras criticas como Repasse, Lightbulb para dicas)

### Arquivos a editar
2. **`src/App.tsx`** - Adicionar rota `/curso` com ProtectedRoute
3. **`src/components/layout/Sidebar.tsx`** - Adicionar item "Curso" na navegacao com icone `GraduationCap`, posicionado antes de Configuracoes

### Design Visual
- Cada fase e um Card com header colorido (gradiente sutil)
- Sub-licoes em Accordion dentro de cada Card
- Badges indicando quantidade de licoes por fase
- Botoes "Ir para [modulo]" que linkam direto para a rota relevante
- Cards de destaque para conceitos criticos (Repasse, Over-servicing, SLA)
- Layout responsivo com max-width para leitura confortavel

### Padrao de Codigo
- Seguir o padrao existente: MainLayout wrapper, hooks do OrganizationContext
- Componentes Shadcn: Card, Accordion, Badge, Button
- Icones Lucide: GraduationCap, BookOpen, Target, DollarSign, BarChart3, Swords, AlertTriangle, Lightbulb, ArrowRight
- Sem dependencias novas necessarias
