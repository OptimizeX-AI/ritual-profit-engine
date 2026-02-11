

# Limpeza de Dados Mockados para Producao

## Situacao Atual

### Dados Mockados no Codigo (3 componentes)
Existem **3 componentes no dashboard** que usam dados hardcoded em vez de dados reais do banco:

1. **`ClientProfitability.tsx`** - Array hardcoded com 5 empresas fictícias (Empresa Alpha, Tech Solutions, etc.) com receita/custos/margem fixos
2. **`DREMini.tsx`** - Array hardcoded com 6 linhas de DRE e valores fixos (R$ 115.000 receita, etc.)
3. **`RevenueChart.tsx`** - Array hardcoded com 6 meses de dados fictícios de receita vs custos

### Dados no Banco de Dados
O banco tem dados de teste mínimos:
- 1 organização, 1 perfil (seu usuário)
- 1 cliente ("create-site"), 1 deal, 1 projeto
- 0 transações, 0 tarefas, 0 contas bancárias, 0 metas

Os demais componentes (War Room, Relatórios, Tarefas) **já usam dados reais** via hooks.

---

## O Que Sera Feito

### 1. Substituir `ClientProfitability.tsx` por dados reais
- Remover o array `clientsData` hardcoded
- Conectar ao hook `useClientProfitability` (que já existe e já é usado no `ClientProfitabilityTable.tsx`)
- Mostrar mensagem "Nenhum dado disponível" quando vazio

### 2. Substituir `DREMini.tsx` por dados reais
- Remover o array `dreData` hardcoded
- Conectar ao hook `useAdvancedDRE` (que já existe e calcula o DRE real)
- Mostrar o mês atual dinamicamente em vez de "Janeiro" fixo

### 3. Substituir `RevenueChart.tsx` por dados reais
- Remover o array `data` hardcoded
- Conectar ao hook `useTransactions` para calcular receita vs custos dos últimos 6 meses
- Mostrar gráfico vazio com mensagem quando não houver dados

### 4. Limpar dados de teste do banco
- Remover o cliente de teste "create-site"
- Remover o deal e projeto de teste associados
- Manter o perfil e organização do usuário intactos (são necessários para o login)

### 5. Ajustar `Index.tsx`
- Remover a referência ao componente `ClientProfitability` mockado (já existe o `ClientProfitabilityTable` com dados reais)
- Manter apenas componentes que usam dados reais

---

## Resultado Final

Após a limpeza:
- **Zero dados mockados** no código - tudo vem do banco
- **Banco limpo** - pronto para dados reais de produção
- **Dashboard funcional** - mostra estados vazios quando não há dados, e dados reais quando houver
- Os componentes mostram mensagens amigáveis como "Nenhum dado disponível" em vez de dados fictícios

