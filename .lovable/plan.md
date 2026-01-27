
# System Master Documentation - Agency Profit Planner V1.0

**Documento**: Documentacao Mestre do Sistema  
**Versao**: 1.0  
**Data**: 27/01/2026  
**Autor**: Arquitetura de Solucoes  

---

## CAPITULO 1: VISAO GERAL E STACK TECNOLOGICA

### 1.1 Descricao do Sistema

O **Agency Profit Planner** e um ERP especializado para agencias de marketing digital, construido sobre a metodologia de gestao de Lazaro do Carmo. O sistema integra quatro modulos principais:

1. **Backoffice & CRM** - Gestao de clientes, contratos e pipeline de vendas
2. **Inteligencia Financeira** - Transacoes, DRE gerencial e fluxo de caixa
3. **Operacao & Rituais** - Tarefas (A Biblia), timesheet e War Room
4. **Inteligencia de Custos** - Alocacao de mao de obra e rentabilidade por cliente

### 1.2 Tech Stack Final

```text
+-------------------+------------------------------------------+
|    CAMADA         |    TECNOLOGIA                            |
+-------------------+------------------------------------------+
| Frontend          | React 18.3, TypeScript, Vite             |
| Estilizacao       | Tailwind CSS, Shadcn/UI (Radix)          |
| State Management  | TanStack React Query v5                  |
| Roteamento        | React Router DOM v6                      |
| Backend/DB        | Supabase (PostgreSQL + Auth + Storage)   |
| Visualizacao      | Recharts v2.15                           |
| Drag & Drop       | @hello-pangea/dnd                        |
| Formularios       | React Hook Form + Zod                    |
| Datas             | date-fns v3                              |
+-------------------+------------------------------------------+
```

### 1.3 Arquitetura de Pastas

```text
src/
├── components/
│   ├── crm/              # CRM Kanban, modais de perda
│   ├── dashboard/        # KPIs, graficos, DRE mini
│   ├── financeiro/       # Seletores de conta, gestores
│   ├── layout/           # MainLayout, Sidebar, NotificationBell
│   ├── onboarding/       # OnboardingWizard
│   ├── projects/         # Cards, Gauge de budget, Aditivos
│   ├── relatorios/       # AdvancedDRE, Profitability
│   ├── skeletons/        # Loading states
│   ├── tasks/            # Modais de edicao, Timesheet
│   ├── ui/               # Shadcn primitives
│   └── warroom/          # ChurnRadar, Goals, Ranking
├── contexts/
│   ├── AuthContext.tsx       # Autenticacao Supabase
│   ├── OrganizationContext.tsx  # Perfil, Org, Roles, Funcoes
│   └── OnboardingContext.tsx    # Tour guiado
├── hooks/
│   ├── useCRMKanban.ts       # Pipeline de vendas
│   ├── useAdvancedDRE.ts     # Calculo DRE 7 linhas
│   ├── useClientProfitability.ts  # Rentabilidade
│   ├── useTransactions.ts    # CRUD financeiro + validacao
│   ├── useTasks.ts           # CRUD tarefas + SLA
│   ├── useChurnRadar.ts      # Alertas de renovacao
│   └── useWorkloadCapacity.ts # Carga de trabalho
├── lib/
│   ├── financialValidation.ts  # BLINDAGEM de repasse
│   └── errorHandler.ts         # Tratamento de erros
├── pages/                # Rotas da aplicacao
└── integrations/supabase/
    ├── client.ts         # Cliente Supabase
    └── types.ts          # Types gerados automaticamente
```

### 1.4 Gerenciamento de Estado

O estado global e gerenciado via **React Query** com as seguintes query keys principais:

| Query Key | Hook | Descricao |
|-----------|------|-----------|
| `["crm-deals", orgId]` | useCRMKanban | Pipeline de vendas |
| `["transactions", orgId]` | useTransactions | Lancamentos financeiros |
| `["tasks", orgId]` | useTasks | Tarefas operacionais |
| `["projects", orgId]` | useProjects | Projetos ativos |
| `["clients", orgId]` | useClients | Cadastro de clientes |
| `["client-profitability", orgId]` | useClientProfitability | Rentabilidade |

**Invalidacao automatica**: Apos mutacoes, as queries relacionadas sao invalidadas para refresh automatico.

---

## CAPITULO 2: MODULOS E FUNCIONALIDADES

### 2.1 CRM - Pipeline de Vendas (`/crm`)

**Arquivo principal**: `src/pages/CRM.tsx`, `src/components/crm/CRMKanbanBoard.tsx`

**Funcionalidades**:
- Kanban drag-and-drop com 5 colunas:
  - `Prospeccao` (10% probabilidade)
  - `Proposta` (40%)
  - `Negociacao` (70%)
  - `Fechado` (100%)
  - `Perdido` (0%)

**Regras de Negocio Implementadas**:

1. **Badge de Origem (Origin Tracking)**:
   ```typescript
   type DealOrigin = "ads" | "indicacao" | "outbound" | "organic";
   ```
   Cada deal carrega sua fonte de aquisicao para analise de atribuicao.

2. **Motivo de Perda Obrigatorio**:
   Quando um deal e movido para "Perdido", o sistema exige selecao de `loss_reason`:
   - Preco
   - Escopo
   - Concorrente
   - Timing
   - Sem Orcamento
   - Mudanca de Decisor
   - Outro

3. **Provisionamento Automatico de Comissao**:
   Ao mover deal para "Fechado", o hook `useCRMKanban` chama:
   ```typescript
   provisionCommission({ dealId, dealValue, salespersonId })
   ```
   Que executa a funcao PostgreSQL `provision_sales_commission()` criando uma transacao de despesa provisoria na categoria "Comissoes de Vendas".

4. **Wizard de Passagem de Bastao**:
   Apos fechar o deal, o modal `CreateProjectFromDealModal` aparece para:
   - Criar ou vincular cliente
   - Definir nome do projeto
   - Especificar horas vendidas (escopo)
   - Criar projeto automaticamente

### 2.2 Projetos (`/projetos`)

**Arquivo principal**: `src/pages/Projetos.tsx`, `src/pages/ProjectDetail.tsx`

**Funcionalidades**:
- Lista de projetos com cards informativos
- Detalhes do projeto com gauge de budget
- Gestao de aditivos (change orders)

**Regras de Negocio Implementadas**:

1. **Controle de Escopo (Budget)**:
   ```typescript
   // Campos no banco:
   initial_budget_hours  // Escopo inicial contratado
   current_budget_hours  // Escopo atualizado (com aditivos)
   ```

2. **Fuel Gauge de Consumo** (`ProjectFuelGauge.tsx`):
   ```typescript
   const percent = (consumedHours / budgetHours) * 100;
   
   // Status visual:
   // < 80%  → Healthy (verde)
   // 80-100% → Attention (amarelo)
   // 100-120% → Warning (laranja)
   // > 120% → Critical - Over-servicing (vermelho)
   ```

3. **Sistema de Aditivos** (`useProjectAddendums.ts`):
   - Registro de aditivos com `hours_added` e `cost_added_centavos`
   - Flag `approved_by_client` para controle de aprovacao
   - **Trigger automatico**: `update_project_budget_on_addendum()` soma horas ao `current_budget_hours`

### 2.3 Tarefas - A Biblia (`/tarefas`)

**Arquivo principal**: `src/pages/Tarefas.tsx`, `src/hooks/useTasks.ts`

**Funcionalidades**:
- Kanban de tarefas por status
- Edicao inline com modal
- Pausa de SLA quando aguardando cliente

**Regras de Negocio Implementadas**:

1. **Campos Obrigatorios**:
   ```typescript
   // Validacao antes de criar tarefa:
   assignee_id: string;   // Dono obrigatorio
   deadline: Date;        // Prazo obrigatorio
   description: string;   // Descricao obrigatoria
   ```
   Erro: "Tarefa sem dono ou prazo nao e permitida"

2. **SLA com Pausa para Cliente**:
   ```typescript
   // Trigger PostgreSQL: track_task_sla_pause()
   
   // Quando status = 'aguardando_cliente':
   sla_paused_at = now();
   
   // Quando sai desse status:
   total_paused_minutes += (now() - sla_paused_at) / 60;
   sla_paused_at = NULL;
   ```
   Badge visual: "Pausado (Cliente)" - delay nao conta contra a equipe.

3. **Status Disponiveis**:
   ```typescript
   type TaskStatus = "todo" | "in_progress" | "waiting_approval" | "done" | "late";
   ```

### 2.4 Financeiro (`/financeiro`)

**Arquivo principal**: `src/pages/Financeiro.tsx`, `src/hooks/useTransactions.ts`

**Funcionalidades**:
- CRUD de transacoes (receitas e despesas)
- Gestao de multiplas contas bancarias
- Dashboard com KPIs financeiros

**Regras de Negocio Implementadas**:

1. **Multi-Contas Bancarias** (`useBankAccounts.ts`):
   - Cada transacao paga atualiza `saldo_atual_centavos` da conta
   - Trigger `update_bank_account_balance()` processa automaticamente

2. **Logica INVIOLAVEL de Repasse** (`financialValidation.ts`):
   ```typescript
   // REGRA CRITICA:
   // Se is_repasse = true E categoria = 'Compra de Midia/Ads':
   //   - nature = 'nao_operacional' (forcado)
   //   - NAO entra no DRE
   //   - NAO afeta rentabilidade
   //   - APENAS afeta fluxo de caixa
   
   function validateRepasse(isRepasse, category, type) {
     if (isRepasse && !isCategoriaRepasse(category)) {
       return { valid: false, error: "Categoria incompativel" };
     }
     return { valid: true, correctedNature: 'nao_operacional' };
   }
   ```

3. **Calculo de Totais**:
   ```typescript
   // Operacional (para DRE):
   calcularTotaisOperacionais(transactions)
   // Filtra: nature === 'operacional' && !is_repasse
   
   // Repasses (apenas fluxo de caixa):
   calcularTotaisRepasses(transactions)
   // Filtra: is_repasse === true
   ```

4. **Classificacao de Custos**:
   ```typescript
   type CostType = 'direto' | 'fixo';
   
   // Se project_id existe → cost_type = 'direto'
   // Se project_id = null → cost_type = 'fixo'
   ```

### 2.5 War Room (`/war-room`)

**Arquivo principal**: `src/pages/WarRoom.tsx`

**Funcionalidades**:
- Gauges de metas (faturamento, vendas, leads)
- Ranking de vendedores
- Radar de churn

**Componentes**:

1. **GoalsGauges.tsx** - 3 Gauges:
   - Meta Financeira: Receitas do mes vs. meta
   - Meta de Vendas: Deals fechados vs. meta
   - Pipeline de Leads: Deals ativos no funil

2. **SalesRanking.tsx** - Tabela:
   | Vendedor | Deals Fechados | Receita Trazida | Ticket Medio |
   
   Ordenado por receita descendente. "Quem esta carregando o piano?"

3. **ChurnRadar.tsx** (`useChurnRadar.ts`):
   ```typescript
   // Identifica clientes com contrato vencendo em ate 60 dias
   // Risk Levels:
   // < 15 dias → critical (vermelho)
   // 15-30 dias → high (laranja)
   // 30-60 dias → medium (amarelo)
   ```

### 2.6 Relatorios (`/relatorios`)

**Arquivo principal**: `src/pages/Relatorios.tsx`

**Componentes**:

1. **AdvancedDRE.tsx** - DRE Gerencial com 7 linhas:
   ```text
   (+) Receita Bruta
   (-) Impostos (% configuravel)
   (-) Custos Variaveis
   ──────────────────────────
   (=) MARGEM DE CONTRIBUICAO
   ──────────────────────────
   (-) Custos Fixos
   (-) Investimentos
   ──────────────────────────
   (=) LUCRO LIQUIDO OPERACIONAL
   ```
   Com drill-down por categoria (expansivel).

2. **AdvancedProfitability.tsx** - Rentabilidade por Cliente:
   ```typescript
   // Formula de Rentabilidade:
   Lucro = Receita - CustosDiretos - CustoMaoDeObra
   
   // Custo Mao de Obra:
   laborCost = SUM(time_spent_minutes / 60 * custo_hora_centavos)
   
   // Margem:
   margin = (Lucro / Receita) * 100
   ```

### 2.7 Capacidade e Equipe (`/capacidade`, `/settings/team`)

**Funcionalidades**:

1. **Workload Capacity** (`useWorkloadCapacity.ts`):
   ```typescript
   // Para cada membro:
   allocatedHours = SUM(estimated_time_minutes) / 60
   utilizationPercent = (allocatedHours / weeklyCapacityHours) * 100
   
   // Status:
   // < 80% → healthy (verde)
   // 80-100% → attention (amarelo)
   // > 100% → overloaded (vermelho - risco de burnout)
   ```

2. **Team Settings** (`TeamSettings.tsx`):
   - Configuracao de `custo_hora_centavos` por membro (admin only)
   - Configuracao de `comissao_percentual` e `tipo_comissao`
   - Atribuicao de `member_function` (assistente, closer, gestor, dono)

---

## CAPITULO 3: OS "FLUXOS DOURADOS" (Workflows)

### 3.1 Fluxo 1: Venda → Entrega

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FLUXO DE CONVERSAO                       │
└─────────────────────────────────────────────────────────────────┘

[CRM Kanban]
     │
     ▼
┌─────────────┐     Arrasta para      ┌──────────────────────┐
│   Deal em   │ ──────────────────►   │  Coluna "Fechado"    │
│ Negociacao  │                       │                      │
└─────────────┘                       └──────────┬───────────┘
                                                 │
                                                 ▼
                                   ┌───────────────────────────┐
                                   │ Trigger: Provision        │
                                   │ Commission (automatico)   │
                                   │                           │
                                   │ → Cria transacao despesa  │
                                   │   categoria "Comissoes"   │
                                   └───────────┬───────────────┘
                                               │
                                               ▼
                                   ┌───────────────────────────┐
                                   │ Modal: CreateProject      │
                                   │ FromDealModal             │
                                   │                           │
                                   │ Inputs:                   │
                                   │ - Nome do Projeto         │
                                   │ - Cliente (cria/vincula)  │
                                   │ - Horas Vendidas (escopo) │
                                   └───────────┬───────────────┘
                                               │
                                               ▼
                                   ┌───────────────────────────┐
                                   │ [PROJETO CRIADO]          │
                                   │                           │
                                   │ initial_budget_hours = X  │
                                   │ current_budget_hours = X  │
                                   └───────────────────────────┘
```

### 3.2 Fluxo 2: Execucao → Custo

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ALOCACAO DE CUSTO                   │
└─────────────────────────────────────────────────────────────────┘

[Tarefa Criada]
     │
     ▼
┌────────────────────┐
│ Atribuicao:        │
│ - assignee_id      │
│ - project_id       │
│ - estimated_time   │
└────────┬───────────┘
         │
         ▼
[Timesheet: Registro de Tempo]
         │
         │  updateTask({ time_spent_minutes })
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│                   CALCULO DE RENTABILIDADE                      │
│                                                                 │
│  Para cada cliente:                                            │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 1. Soma receitas vinculadas aos projetos do cliente    │   │
│  │                                                         │   │
│  │ 2. Soma custos diretos (transactions com project_id)   │   │
│  │                                                         │   │
│  │ 3. Calcula custo de mao de obra:                       │   │
│  │    FOR cada task em projetos do cliente:               │   │
│  │       hoursWorked = time_spent_minutes / 60            │   │
│  │       hourlyRate = profiles.custo_hora_centavos        │   │
│  │       laborCost += hoursWorked * hourlyRate            │   │
│  │                                                         │   │
│  │ 4. Lucro = Receita - CustosDiretos - CustoMaoDeObra   │   │
│  │                                                         │   │
│  │ 5. Margem = (Lucro / Receita) * 100                    │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Fluxo 3: Transacao Financeira → DRE

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO FINANCEIRO (DRE)                       │
└─────────────────────────────────────────────────────────────────┘

[Nova Transacao]
       │
       ├──── is_repasse = true? ────────────────────┐
       │           │                                │
       │          NAO                              SIM
       │           │                                │
       │           ▼                                ▼
       │  ┌────────────────────┐    ┌────────────────────────────┐
       │  │ Valida categoria   │    │ REPASSE: Apenas Caixa     │
       │  │ de repasse         │    │                            │
       │  └────────┬───────────┘    │ nature = 'nao_operacional' │
       │           │                │ NAO entra no DRE           │
       │          FALHA?           │ NAO afeta rentabilidade    │
       │           │                │                            │
       │          SIM               │ Apenas afeta:              │
       │           │                │ - fluxoCaixaRepasses       │
       │           ▼                │ - saldoBancario            │
       │    [ERRO: Bloqueado]       └────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────┐
│                 PROCESSAMENTO NORMAL (Operacional)            │
│                                                                │
│  type = 'receita' ────► DRE: (+) Receita Bruta               │
│                                                                │
│  type = 'despesa':                                            │
│     ├─ categoria in VARIAVEIS ─► DRE: (-) Custos Variaveis   │
│     ├─ categoria in INVESTIMENTO ─► DRE: (-) Investimentos   │
│     └─ outros ─► DRE: (-) Custos Fixos                       │
│                                                                │
│  Resultado: Alimenta calculo de Lucro Liquido                 │
└───────────────────────────────────────────────────────────────┘
```

---

## CAPITULO 4: SEGURANCA E GOVERNANCA (SecOps)

### 4.1 Arquitetura de Autenticacao

```text
┌─────────────────────────────────────────────────────────────┐
│                   CAMADAS DE SEGURANCA                      │
├─────────────────────────────────────────────────────────────┤
│  1. SUPABASE AUTH                                           │
│     - JWT tokens com refresh automatico                     │
│     - Auto-confirm email habilitado                         │
│     - Trigger handle_new_user() cria org + profile + role   │
├─────────────────────────────────────────────────────────────┤
│  2. ROW LEVEL SECURITY (RLS)                               │
│     - Todas as tabelas com RLS habilitado                  │
│     - Isolamento por organization_id                        │
├─────────────────────────────────────────────────────────────┤
│  3. SECURITY DEFINER FUNCTIONS                             │
│     - has_role(_user_id, _role)                            │
│     - get_user_organization_id(_user_id)                   │
│     - can_access_financeiro(_user_id)                      │
│     - can_access_warroom(_user_id)                         │
├─────────────────────────────────────────────────────────────┤
│  4. FRONTEND ROUTE PROTECTION                              │
│     - ProtectedRoute: Requer autenticacao                  │
│     - AdminRoute: Requer role = 'admin'                    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Protecao de Dados Sensiveis

**View `profiles_public`**:
```sql
CREATE VIEW profiles_public AS
SELECT 
  id, name, organization_id, created_at,
  member_function, avatar_url, weekly_capacity_hours
  -- OMITIDO: custo_hora_centavos, comissao_percentual, tipo_comissao
FROM profiles;
```

Usuarios nao-admin que consultam perfis via SDK so veem os campos publicos.

**Funcao de verificacao**:
```sql
CREATE FUNCTION can_view_custo_hora() RETURNS boolean AS $$
  SELECT has_role(auth.uid(), 'admin')
$$;
```

### 4.3 Policies RLS por Tabela

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| transactions | Org match | Admin only | Admin only | Admin only |
| bank_accounts | Org match | Admin only | Admin only | Admin only |
| tasks | Org match | Org match | Org match | Org match |
| projects | Via client org | Via client org | Via client org | Via client org |
| deals | Org match | Org match | Org match | Org match |
| monthly_goals | Org match | Admin only | Admin only | Admin only |

### 4.4 Controle de Rotas (Frontend)

**AdminRoute.tsx**:
```typescript
export function AdminRoute({ children }) {
  const { isAdmin } = useOrganization();
  
  if (!isAdmin) {
    return (
      <Card>
        <ShieldX /> Acesso Restrito
        Esta area e restrita a administradores.
      </Card>
    );
  }
  
  return <>{children}</>;
}
```

**Rotas protegidas por AdminRoute**:
- `/financeiro`
- `/war-room`
- `/relatorios`
- `/settings/team`
- `/configuracoes`

### 4.5 Sistema de Funcoes (member_function)

```sql
CREATE TYPE member_function AS ENUM (
  'assistente',  -- Acesso basico
  'closer',      -- Acesso ao War Room
  'gestor',      -- Acesso a Financeiro + War Room
  'dono'         -- Acesso total
);
```

**Funcoes de verificacao**:
```sql
can_access_financeiro(_user_id) → 
  admin OR gestor OR dono

can_access_warroom(_user_id) → 
  admin OR closer OR gestor OR dono
```

---

## CAPITULO 5: AUTOMACOES DE BANCO (Triggers & Seeds)

### 5.1 Triggers Ativos

| Trigger | Tabela | Evento | Funcao | Descricao |
|---------|--------|--------|--------|-----------|
| trigger_seed_default_categories | organizations | AFTER INSERT | seed_default_categories() | Popula plano de contas padrao |
| trigger_track_sla_pause | tasks | BEFORE UPDATE | track_task_sla_pause() | Rastreia tempo pausado |
| trigger_update_budget | project_addendums | AFTER INSERT | update_project_budget_on_addendum() | Soma horas ao budget |
| trigger_balance_update | transactions | AFTER UPDATE | update_bank_account_balance() | Atualiza saldo bancario |
| trigger_budget_alert | tasks | AFTER UPDATE | check_project_budget_alert() | Notifica 90% do budget |
| trigger_overdue_tasks | tasks | AFTER UPDATE | check_overdue_tasks_notification() | Notifica tarefas atrasadas |
| trigger_task_assignment | tasks | AFTER INSERT/UPDATE | notify_task_assignment() | Notifica nova atribuicao |
| trigger_new_addendum | project_addendums | AFTER INSERT | notify_new_addendum() | Notifica novo aditivo |
| trigger_handle_new_user | auth.users | AFTER INSERT | handle_new_user() | Cria org + profile + role |

### 5.2 Seed de Categorias (Plano de Contas Baker)

```sql
CREATE FUNCTION seed_default_categories() 
RETURNS TRIGGER AS $$
BEGIN
  -- RECEITAS
  INSERT INTO transaction_categories VALUES
    ('Fee Mensal (Recorrente)', 'receita'),
    ('Projeto Pontual', 'receita'),
    ('Success Fee', 'receita');
  
  -- CUSTOS VARIAVEIS
  INSERT INTO transaction_categories VALUES
    ('Impostos (Simples/Presumido)', 'despesa', 'variavel'),
    ('Comissoes de Venda', 'despesa', 'variavel'),
    ('Taxas Bancarias/Boletos', 'despesa', 'variavel');
  
  -- CUSTOS DIRETOS
  INSERT INTO transaction_categories VALUES
    ('Freelancers / Terceirizados', 'despesa', 'variavel'),
    ('Hospedagem / Servidores', 'despesa', 'variavel'),
    ('Compra de Midia / Repasse', 'despesa', 'variavel');
  
  -- CUSTOS FIXOS
  INSERT INTO transaction_categories VALUES
    ('Folha de Pagamento', 'despesa', 'fixo'),
    ('Prolabore Socios', 'despesa', 'fixo'),
    ('Aluguel & Infraestrutura', 'despesa', 'fixo'),
    ('Softwares & Licencas', 'despesa', 'fixo'),
    ('Marketing da Agencia', 'despesa', 'fixo');
  
  RETURN NEW;
END;
$$;
```

Este seed garante que toda nova organizacao inicie com uma estrutura contabil profissional alinhada ao modelo de agencias.

### 5.3 Provisionamento de Comissao

```sql
CREATE FUNCTION provision_sales_commission(
  p_deal_id uuid,
  p_deal_value integer,
  p_salesperson_id uuid,
  p_organization_id uuid
) RETURNS uuid AS $$
DECLARE
  commission_amount INTEGER;
BEGIN
  -- Calcula comissao baseado no perfil do vendedor
  commission_amount := calculate_commission(p_deal_value, p_salesperson_id);
  
  IF commission_amount > 0 THEN
    INSERT INTO transactions (
      organization_id,
      description,
      category,
      type,
      value_centavos,
      status,
      nature,
      cost_type,
      salesperson_id
    ) VALUES (
      p_organization_id,
      'Comissao de Vendas - Deal #' || LEFT(p_deal_id::TEXT, 8),
      'Comissoes de Vendas',
      'despesa',
      commission_amount,
      'pendente',
      'operacional',
      'variavel',
      p_salesperson_id
    );
  END IF;
END;
$$;
```

### 5.4 Atualizacao de Saldo Bancario

```sql
CREATE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando transacao e marcada como paga
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    IF NEW.type = 'receita' THEN
      UPDATE bank_accounts SET saldo_atual_centavos = saldo_atual_centavos + NEW.value_centavos;
    ELSE
      UPDATE bank_accounts SET saldo_atual_centavos = saldo_atual_centavos - NEW.value_centavos;
    END IF;
  END IF;
  
  -- Quando transacao paga e revertida
  IF OLD.status = 'pago' AND NEW.status != 'pago' THEN
    -- Operacao inversa
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

## ANEXO: GLOSSARIO DE TERMOS

| Termo | Definicao |
|-------|-----------|
| Over-servicing | Quando horas trabalhadas excedem o escopo contratado |
| Repasse | Valor de midia que passa pela agencia mas nao e receita propria |
| Margem de Contribuicao | Receita - Impostos - Custos Variaveis |
| Lucro Liquido | Margem Contribuicao - Custos Fixos - Investimentos |
| Churn Radar | Alerta de clientes com contratos proximos do vencimento |
| A Biblia | Modulo de tarefas com regras de SLA e governanca |
| Passagem de Bastao | Momento de transicao deal fechado → projeto criado |

---

**Documento aprovado para entrega V1.0**

*Assinatura do Arquiteto de Solucoes*  
*27/01/2026*
