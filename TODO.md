# 🧠 SPRINT CIRÚRGICA — Agency Profit Planner

## 📋 Regras Globais
- [x] NÃO refatorar CSS
- [x] NÃO mudar arquitetura existente
- [x] USAR React Query, Supabase client e padrões existentes
- [x] Código funcional > estética

---

## 🔥 PASSO 1 — DASHBOARD DA VERDADE (Rentabilidade Real)

### 🧩 ARQUIVO 1 — Hook de Negócio
- [x] **src/hooks/useClientProfitability.ts**
  - [x] Usar useQuery do @tanstack/react-query
  - [x] Buscar dados: clients, projects, transactions, tasks, profiles
  - [x] Receita: transactions.type === 'income' && is_repasse === false
  - [x] Custos Diretos: transactions.type === 'expense' && is_repasse === false
  - [x] Custo Pessoal: (tasks.time_spent_minutes / 60) * profiles.custo_hora_centavos
  - [x] Retorno: { clientId, clientName, revenue, laborCost, directCosts, profit, margin }[]

### 🧩 ARQUIVO 2 — Tabela de Rentabilidade
- [x] **src/components/dashboard/ClientProfitabilityTable.tsx**
  - [x] Usar useClientProfitability
  - [x] Colunas: Cliente, Receita, Custo Pessoal, Margem Real (%)
  - [x] margin < 20% → texto vermelho
  - [x] margin >= 20% → texto verde
  - [x] Usar components/ui/table

### 🧩 ARQUIVO 3 — Conectar no Dashboard
- [x] **src/pages/Index.tsx**
  - [x] Importar ClientProfitabilityTable
  - [x] Renderizar abaixo dos KPIs existentes
  - [x] NÃO remover nada já existente

---

## 🧨 PASSO 2 — CRM KANBAN (Bíblia Visual)

### 🧩 ARQUIVO 4 — Hook do CRM
- [x] **src/hooks/useCRMKanban.ts**
  - [x] Buscar deals
  - [x] Atualizar stage com optimistic update
  - [x] Colunas ENUM: ['prospecção', 'qualificado', 'proposta', 'negociação', 'fechado']
  - [x] Pipeline ponderado: Σ(valor * probabilidade) - ignorar fechados

### 🧩 ARQUIVO 5 — Board Kanban
- [x] **src/components/crm/CRMKanbanBoard.tsx**
  - [x] Usar @hello-pangea/dnd
  - [x] Uma coluna por estágio
  - [x] Card: Cliente, Valor, Probabilidade
  - [x] Drag and Drop → Atualizar stage no Supabase
  - [x] Optimistic update

### 🧩 ARQUIVO 6 — Página CRM
- [x] **src/pages/CRM.tsx**
  - [x] Substituir layout atual por CRMKanbanBoard
  - [x] Exibir KPI "Pipeline Ponderado" no topo

---

## ⚔️ PASSO 3 — WAR ROOM (Ritual Executivo)

### 🧩 ARQUIVO 7 — Página Executiva
- [x] **src/pages/WarRoom.tsx**
  - [x] Página somente leitura
  - [x] Nenhum botão de ação
  - [x] Layout grid simples
  - [x] Bloco 1: Receita do Mês (transactions income, !is_repasse, mês atual)
  - [x] Bloco 2: Projetos em Risco (horas_realizadas > 80% horas_contratadas)
  - [x] Bloco 3: Gargalos (deadline < hoje OU status waiting_approval)

### 🧩 ARQUIVO 8 — Rota
- [x] **src/App.tsx**
  - [x] Adicionar: <Route path="/war-room" element={<WarRoom />} />

---

## 🧠 SPRINT 2 — INPUTS CRÍTICOS PARA RENTABILIDADE

### 🧩 TAREFA 1 — Gestão de Time
- [x] **src/pages/settings/TeamSettings.tsx**
  - [x] Criar página de gestão de custo/hora
  - [x] Input formatado em BRL
  - [x] Tooltip explicativo: "Custo Hora = (Salário + Impostos + Benefícios) / 160h"
  - [x] Salvar no Supabase (custo_hora_centavos)
  - [x] Usar hook useTeamMembers existente

### 🧩 TAREFA 2 — Modal de Transações
- [x] **src/pages/Financeiro.tsx**
  - [x] Switch "É Repasse de Mídia?" (is_repasse)
  - [x] Select de Projeto Vinculado (project_id)
  - [x] Alerta visual quando is_repasse = true
  - [x] Compatibilidade com transações antigas

### 🧩 TAREFA 3 — Proteção de Rotas
- [x] **src/components/ProtectedRoute.tsx**
  - [x] Prop requireAdmin para rotas admin-only
- [x] **src/App.tsx**
  - [x] /war-room protegido com requireAdmin
  - [x] /settings/team protegido com requireAdmin

---

## 🔄 SPRINT 3 — GOLDEN PATH (Fluxo Operacional Completo)

### 🧩 TAREFA 1 — Automação de Handover (CRM → Projetos)
- [x] **src/components/crm/CRMKanbanBoard.tsx**
  - [x] Detectar quando deal é movido para "fechado"
  - [x] Abrir modal de criação de projeto
  - [x] Só atualizar stage após sucesso na criação
- [x] **src/components/projects/CreateProjectFromDealModal.tsx**
  - [x] Criar novo componente
  - [x] Campos pré-preenchidos: Cliente, Valor Mensal
  - [x] Campo obrigatório: Horas Vendidas
  - [x] Criar cliente automaticamente se não existir
  - [x] Redirecionar para /projetos após sucesso

### 🧩 TAREFA 2 — Dashboard Pessoal (Minhas Tarefas)
- [x] **src/components/tasks/MyActiveTasks.tsx**
  - [x] Query: tarefas onde assignee_id === user.id && status !== 'done'
  - [x] Ordenar por deadline ASC
  - [x] Exibir: Nome, Projeto, Prazo
  - [x] Botão "Registrar Tempo" → abre TimesheetModal
- [x] **src/pages/Index.tsx**
  - [x] Importar MyActiveTasks
  - [x] Exibir abaixo dos KPIs principais

### 🧩 TAREFA 3 — Indicador de Over-Servicing
- [x] **src/components/projects/ProjectCard.tsx**
  - [x] Criar componente de card de projeto
  - [x] Cálculo: (horas_realizadas / horas_contratadas) * 100
  - [x] Barra de progresso com cores:
    - [x] < 80% → verde
    - [x] 80-100% → amarelo
    - [x] > 100% → vermelho
  - [x] Ícone de alerta + tooltip para over-servicing

---

## 💰 SPRINT 4 — ERP FINANCEIRO AVANÇADO (Auditoria Elite)

### 🧩 TAREFA 1 — Multi-Contas Bancárias
- [x] **Migração DB: bank_accounts**
  - [x] Tabela: id, organization_id, name, banco, agencia, conta, saldo_inicial, saldo_atual, is_default
  - [x] RLS policies configuradas
  - [x] Trigger para atualizar saldo automaticamente

- [x] **src/hooks/useBankAccounts.ts**
  - [x] CRUD completo para contas bancárias
  - [x] Saldo consolidado calculado
  
- [x] **src/components/financeiro/BankAccountSelector.tsx**
  - [x] Dropdown com opção "Consolidado"
  - [x] Exibir saldo de cada conta
  
- [x] **src/components/financeiro/BankAccountsManager.tsx**
  - [x] CRUD de contas bancárias
  - [x] Exibir saldo atual de cada conta
  - [x] Indicador de conta padrão

### 🧩 TAREFA 2 — Sistema de Comissões
- [x] **Migração DB: profiles**
  - [x] Campo: comissao_percentual (DECIMAL)
  - [x] Campo: tipo_comissao (sobre_faturamento | sobre_margem)

- [x] **src/hooks/useCommissions.ts**
  - [x] Função para calcular comissão
  - [x] Função para criar transação de comissão automática

- [ ] **src/components/crm/CRMKanbanBoard.tsx** (Atualização)
  - [ ] Ao fechar deal, disparar criação de comissão provisionada
  - [ ] Vincular vendedor ao deal

### 🧩 TAREFA 3 — DRE Avançado com Drill-Down
- [x] **src/hooks/useAdvancedDRE.ts**
  - [x] Estrutura contábil rígida (7 linhas)
  - [x] Categorização: Variável, Fixo, Investimento
  - [x] Cálculo de impostos configurável

- [x] **src/components/relatorios/AdvancedDRE.tsx**
  - [x] Explosão de categorias (Drill-Down)
  - [x] Destaque para Margem de Contribuição
  - [x] Cores dinâmicas para resultado

### 🧩 TAREFA 4 — Rentabilidade com Comissão
- [x] **src/components/relatorios/AdvancedProfitability.tsx**
  - [x] Margem ajustada (desconta comissão)
  - [x] Visual de "projeto já nasce com 10% a menos"
  - [x] Ordenação por pior margem

### 🧩 TAREFA 5 — Configurações Financeiras
- [x] **Migração DB: organizations**
  - [x] Campo: imposto_percentual (DECIMAL)

- [ ] **src/pages/Configuracoes.tsx** (Atualização)
  - [ ] Input para % de impostos global
  - [ ] Gestão de categorias customizáveis

---

## ✅ CHECKLIST DE ACEITAÇÃO (SPRINT DONE)

### Sprint 1-3
- [x] Hook useClientProfitability funcionando
- [x] Margem real exibida por cliente
- [x] CRM com Kanban arrastável
- [x] Pipeline ponderado visível
- [x] Página /war-room funcional
- [x] Nenhuma regressão no financeiro atual
- [x] Página /settings/team criada
- [x] Admin consegue editar custo hora
- [x] Input formatado em BRL
- [x] Tooltip explicativo visível
- [x] Modal de transação com Switch de repasse
- [x] Modal de transação com Select de projeto
- [x] Alerta visual para repasse
- [x] Rota /war-room protegida
- [x] Deal fechado gera modal de projeto
- [x] Projeto criado automaticamente
- [x] Usuário vê suas tarefas ativas
- [x] Registro de tempo em 1 clique
- [x] Projetos mostram risco de over-servicing

### Sprint 4 (ERP Avançado)
- [x] Tabela bank_accounts criada com RLS
- [x] Hook useBankAccounts implementado
- [x] Componente BankAccountsManager funcional
- [x] Campos de comissão em profiles
- [x] Hook useCommissions implementado
- [x] DRE com estrutura contábil rígida
- [x] Drill-down de categorias funcionando
- [x] Margem de Contribuição destacada
- [x] Rentabilidade ajustada por comissão
- [ ] Transação filtrável por conta bancária
- [ ] Comissão automática ao fechar deal
- [ ] % de imposto configurável na UI

---

## 📊 Status de Arquivos

| Arquivo | Status |
|---------|--------|
| src/hooks/useClientProfitability.ts | ✅ Concluído |
| src/components/dashboard/ClientProfitabilityTable.tsx | ✅ Concluído |
| src/pages/Index.tsx | ✅ Concluído |
| src/hooks/useCRMKanban.ts | ✅ Concluído |
| src/components/crm/CRMKanbanBoard.tsx | ✅ Concluído |
| src/pages/CRM.tsx | ✅ Concluído |
| src/pages/WarRoom.tsx | ✅ Concluído |
| src/App.tsx | ✅ Concluído |
| src/pages/settings/TeamSettings.tsx | ✅ Concluído |
| src/components/ProtectedRoute.tsx | ✅ Concluído |
| src/components/projects/CreateProjectFromDealModal.tsx | ✅ Concluído |
| src/components/tasks/MyActiveTasks.tsx | ✅ Concluído |
| src/components/projects/ProjectCard.tsx | ✅ Concluído |
| src/hooks/useBankAccounts.ts | ✅ Concluído |
| src/components/financeiro/BankAccountSelector.tsx | ✅ Concluído |
| src/components/financeiro/BankAccountsManager.tsx | ✅ Concluído |
| src/hooks/useCommissions.ts | ✅ Concluído |
| src/hooks/useAdvancedDRE.ts | ✅ Concluído |
| src/components/relatorios/AdvancedDRE.tsx | ✅ Concluído |
| src/components/relatorios/AdvancedProfitability.tsx | ✅ Concluído |
| src/pages/Relatorios.tsx | ✅ Atualizado |
| src/contexts/OrganizationContext.tsx | ✅ Atualizado |

---

## 🗄️ Migrações de Banco de Dados

| Migração | Data | Descrição |
|----------|------|-----------|
| Metas Financeiras | 2026-01-27 | meta_receita_liquida_centavos, teto_custos_fixos_centavos |
| ERP Avançado | 2026-01-27 | bank_accounts, comissao_percentual, tipo_comissao, imposto_percentual, transaction_categories |
