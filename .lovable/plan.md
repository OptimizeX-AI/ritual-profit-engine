

# Remover Badge "3" Mockado do CRM

## Problema
Na sidebar (`src/components/layout/Sidebar.tsx`), o item de navegacao do CRM possui um badge hardcoded com o valor "3" (linha 26):
```
{ title: "CRM", href: "/crm", icon: Target, badge: "3" }
```

## Solucao

Remover a propriedade `badge: "3"` do item CRM no array `navItems`. O badge nao esta conectado a nenhum dado real -- e puramente mockado.

### Detalhes Tecnicos

**Arquivo:** `src/components/layout/Sidebar.tsx`

Alterar a linha 26 de:
```typescript
{ title: "CRM", href: "/crm", icon: Target, badge: "3", onboardingId: "nav-crm" },
```
Para:
```typescript
{ title: "CRM", href: "/crm", icon: Target, onboardingId: "nav-crm" },
```

Isso remove o numero "3" que aparece ao lado do texto "CRM" na sidebar. Nenhum outro arquivo precisa ser alterado.

