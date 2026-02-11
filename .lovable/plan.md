

# Reset de Senha para augusto_ccn@hotmail.com

## O Que Sera Feito

Criar uma edge function temporaria que usa a Admin API para atualizar a senha do usuario `augusto_ccn@hotmail.com` para `Fvm2026@!`.

## Passos

1. **Criar edge function temporaria** `reset-password` que usa `supabase.auth.admin.updateUserById()` para definir a nova senha
2. **Chamar a function** para executar o reset
3. **Verificar** que o login funciona com as novas credenciais
4. **Remover a edge function** apos o uso (nao deve ficar em producao)

## Detalhes Tecnicos

- A function usara a `SUPABASE_SERVICE_ROLE_KEY` (ja configurada) para ter permissao de admin
- Primeiro busca o usuario pelo email, depois atualiza a senha
- Apos confirmar que funciona, a function sera deletada por seguranca

