

# Plano: Migração para Supabase externo + melhorias no Dashboard

## Resumo
Migrar o frontend do Lovable Cloud para um Supabase externo, corrigir fluxos de login/signup, melhorar dashboard e settings com novas seções.

## Arquivos a modificar

### 1. `src/integrations/supabase/client.ts` — Substituir conexão
Hardcode URL e anon key do Supabase externo (`mwvbxojvmehbmmwhblta`).

### 2. `.env` — Limpar
Substituir por comentários placeholder.

### 3. `src/pages/Login.tsx` — Corrigir signup
- Signup chama `fetch` para edge function `signup-with-company` no Supabase externo, depois faz login automático.
- `onBlur` no campo email: extrair domínio, ignorar provedores genéricos, chamar `supabase.rpc('get_company_by_domain', { p_email })`. Se retornar empresa, mostrar banner amarelo e desabilitar signup.

### 4. `src/pages/Dashboard.tsx` — Múltiplas alterações

**DashboardView:**
- Substituir cálculo manual por `supabase.from("dashboard_summary").select("*").eq("company_id", ...)`.
- Cards: ativos (verde), vencendo em breve (amarelo), vencidos (vermelho), valor total (azul, formatado R$).
- Loading skeleton.

**ContractsView:**
- Upload disabled quando `currentFolder` é null, com mensagem explicativa.
- Botão IA: remover `disabled`, implementar lógica de base64 + fetch para `ai-extract-contract` edge function, preencher campos automaticamente.
- Coluna "Alerta" na tabela: badge amarelo "⚠ Vence em breve" se `expiration_alert === 'expiring_soon'`.
- `window.confirm` antes de deletar pastas e contratos.
- Loading skeleton.

**SettingsView:**
- Permissões: garantir insert correto com `{ company_id, role, folder_id, can_read, can_write }`.
- Nova seção "Convidar usuários": input email + select role + botão. Lista convites de `invites` table, com botão cancelar.
- Nova seção "Recebimento por email": buscar `email_slug` de `companies`, exibir `{slug}@tester.com.br` com botão copiar.
- Nova seção "Sincronizar caixa de email": buscar `email_connections`, botões Gmail/Outlook com toast "Em breve!", listar conexões existentes.

### 5. `src/components/ProtectedRoute.tsx` — Redirecionar para /pricing
- Subscription inativa ou null (após loading) → `<Navigate to="/pricing" />`.

### 6. `src/integrations/supabase/types.ts` — Atualizar tipos
- Adicionar tipos para `dashboard_summary` (view), `invites`, `email_connections` tables.
- Adicionar `email_slug` à tabela `companies`.
- Adicionar `expiration_alert` à tabela `contracts` (ou view).

## Notas técnicas
- O types.ts precisa ser atualizado manualmente pois o Supabase externo não o gera automaticamente neste projeto.
- As tabelas `dashboard_summary`, `invites`, `email_connections` e os campos `email_slug`/`expiration_alert` já devem existir no Supabase externo — o frontend apenas consome.
- A RPC `get_company_by_domain` também deve existir no Supabase externo.

