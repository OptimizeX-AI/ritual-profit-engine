# 🧠 SPRINT CIRÚRGICA — Agency Profit Planner

## 📋 Regras Globais
- [ ] NÃO refatorar CSS
- [ ] NÃO mudar arquitetura existente
- [ ] USAR React Query, Supabase client e padrões existentes
- [ ] Código funcional > estética

---

## 🔥 PASSO 1 — DASHBOARD DA VERDADE (Rentabilidade Real)

### 🧩 ARQUIVO 1 — Hook de Negócio
- [ ] **src/hooks/useClientProfitability.ts**
  - [ ] Usar useQuery do @tanstack/react-query
  - [ ] Buscar dados: clients, projects, transactions, tasks, profiles
  - [ ] Receita: transactions.type === 'income' && is_repasse === false
  - [ ] Custos Diretos: transactions.type === 'expense' && is_repasse === false
  - [ ] Custo Pessoal: (tasks.time_spent_minutes / 60) * profiles.custo_hora_centavos
  - [ ] Retorno: { clientId, clientName, revenue, laborCost, directCosts, profit, margin }[]

### 🧩 ARQUIVO 2 — Tabela de Rentabilidade
- [ ] **src/components/dashboard/ClientProfitabilityTable.tsx**
  - [ ] Usar useClientProfitability
  - [ ] Colunas: Cliente, Receita, Custo Pessoal, Margem Real (%)
  - [ ] margin < 20% → texto vermelho
  - [ ] margin >= 20% → texto verde
  - [ ] Usar components/ui/table

### 🧩 ARQUIVO 3 — Conectar no Dashboard
- [ ] **src/pages/Index.tsx**
  - [ ] Importar ClientProfitabilityTable
  - [ ] Renderizar abaixo dos KPIs existentes
  - [ ] NÃO remover nada já existente

---

## 🧨 PASSO 2 — CRM KANBAN (Bíblia Visual)

### 🧩 ARQUIVO 4 — Hook do CRM
- [ ] **src/hooks/useCRMKanban.ts**
  - [ ] Buscar deals
  - [ ] Atualizar stage com optimistic update
  - [ ] Colunas ENUM: ['prospecção', 'qualificado', 'proposta', 'negociação', 'fechado']
  - [ ] Pipeline ponderado: Σ(valor * probabilidade) - ignorar fechados

### 🧩 ARQUIVO 5 — Board Kanban
- [ ] **src/components/crm/CRMKanbanBoard.tsx**
  - [ ] Usar @hello-pangea/dnd
  - [ ] Uma coluna por estágio
  - [ ] Card: Cliente, Valor, Probabilidade
  - [ ] Drag and Drop → Atualizar stage no Supabase
  - [ ] Optimistic update

### 🧩 ARQUIVO 6 — Página CRM
- [ ] **src/pages/CRM.tsx**
  - [ ] Substituir layout atual por CRMKanbanBoard
  - [ ] Exibir KPI "Pipeline Ponderado" no topo

---

## ⚔️ PASSO 3 — WAR ROOM (Ritual Executivo)

### 🧩 ARQUIVO 7 — Página Executiva
- [ ] **src/pages/WarRoom.tsx**
  - [ ] Página somente leitura
  - [ ] Nenhum botão de ação
  - [ ] Layout grid simples
  - [ ] Bloco 1: Receita do Mês (transactions income, !is_repasse, mês atual)
  - [ ] Bloco 2: Projetos em Risco (horas_realizadas > 80% horas_contratadas)
  - [ ] Bloco 3: Gargalos (deadline < hoje OU status waiting_approval)

### 🧩 ARQUIVO 8 — Rota
- [ ] **src/App.tsx**
  - [ ] Adicionar: <Route path="/war-room" element={<WarRoom />} />

---

## ✅ CHECKLIST DE ACEITAÇÃO (SPRINT DONE)

- [ ] Hook useClientProfitability funcionando
- [ ] Margem real exibida por cliente
- [ ] CRM com Kanban arrastável
- [ ] Pipeline ponderado visível
- [ ] Página /war-room funcional
- [ ] Nenhuma regressão no financeiro atual

---

## 📊 Status

| Arquivo | Status |
|---------|--------|
| src/hooks/useClientProfitability.ts | ⏳ Pendente |
| src/components/dashboard/ClientProfitabilityTable.tsx | ⏳ Pendente |
| src/pages/Index.tsx | ⏳ Pendente |
| src/hooks/useCRMKanban.ts | ⏳ Pendente |
| src/components/crm/CRMKanbanBoard.tsx | ⏳ Pendente |
| src/pages/CRM.tsx | ⏳ Pendente |
| src/pages/WarRoom.tsx | ⏳ Pendente |
| src/App.tsx | ⏳ Pendente |
