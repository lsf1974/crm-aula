# CRM Login e Dashboard — Design Spec

**Data:** 2026-05-14  
**Status:** Aprovado (v3 — revisado após 2º code review)

---

## Visão Geral

Sistema CRM de uso pessoal com autenticação por email/senha e dashboard de pipeline de vendas. Construído com Next.js 14, Supabase Auth e PostgreSQL.

---

## Arquitetura

- **Next.js 14** (App Router) — fullstack, rotas e API em um projeto único
- **Supabase Auth** — autenticação email/senha, sessão via cookie gerenciado pelo `@supabase/ssr`
- **Supabase PostgreSQL** — banco de dados gerenciado para oportunidades de venda
- **Tailwind CSS** — estilização moderna e responsiva
- **Middleware Next.js** — proteção de rotas com `matcher` configurado, redireciona não autenticados para `/login`

---

## Variáveis de Ambiente

Arquivo `.env.local` necessário:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Pacotes obrigatórios:
- `@supabase/supabase-js`
- `@supabase/ssr` — necessário para cookie-based auth no Next.js 14 App Router

---

## Páginas e Rotas

| Rota | Descrição | Acesso |
|---|---|---|
| `/login` | Formulário de login email/senha | Público |
| `/dashboard` | Métricas + Kanban de pipeline + botão "Novo Deal" | Protegido |
| `/deal/new` | Formulário de criação de novo deal | Protegido |
| `/deal/[id]` | Detalhe e edição de oportunidade existente | Protegido |

Rotas protegidas redirecionam automaticamente para `/login` se não houver sessão ativa.

O middleware usa `matcher` para proteger apenas rotas da aplicação, excluindo `_next/static`, `_next/image`, `favicon.ico` e `/login`.

---

## Dashboard

### Cards de Métricas (topo)
- Total de deals ativos (stage != `closed`)
- Valor total em pipeline — soma dos deals ativos (R$)
- Taxa de conversão — deals `closed` / total de deals criados (%)

### Quadro Kanban
4 colunas fixas representando as etapas do pipeline:
1. **Prospecção** (`prospecting`)
2. **Proposta** (`proposal`)
3. **Negociação** (`negotiation`)
4. **Fechado** (`closed`)

Cada deal exibe: nome, valor em R$, e botões para mover entre colunas.

Botão **"+ Novo Deal"** no topo do dashboard redireciona para `/deal/new`.

---

## Modelo de Dados

### Tabela `deals`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único (gerado automaticamente) |
| `user_id` | UUID | FK para `auth.users` do Supabase |
| `title` | text | Nome da oportunidade |
| `value` | numeric | Valor em R$ |
| `stage` | text | `prospecting` \| `proposal` \| `negotiation` \| `closed` |
| `notes` | text | Observações livres (opcional) |
| `created_at` | timestamp | Gerado automaticamente via `DEFAULT now()` |
| `updated_at` | timestamp | Atualizado via trigger `BEFORE UPDATE` usando a extensão `moddatetime` do Supabase |

**Trigger `updated_at`:** ativar a extensão `moddatetime` no Supabase e criar o trigger:
```sql
CREATE EXTENSION IF NOT EXISTS moddatetime;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

**Row Level Security (RLS):** ativado — cada usuário acessa apenas seus próprios deals.

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `LoginForm` | Formulário email/senha com validação e mensagem de erro |
| `MetricsCards` | 3 cards calculados dinamicamente dos deals |
| `KanbanBoard` | Renderiza as 4 colunas do pipeline |
| `DealCard` | Card compacto com nome, valor e ações |
| `DealForm` | Formulário de criação e edição de deal (usado em `/deal/new` e `/deal/[id]`) |

### Comportamento do `DealForm`

| Contexto | Modo | Comportamento |
|---|---|---|
| `/deal/new` | Criação | Campos vazios; submit faz `INSERT`; redireciona para `/dashboard` após sucesso |
| `/deal/[id]` | Edição | Campos pré-populados via Server Component; submit faz `UPDATE`; permanece na página após sucesso |

- Modo detectado pela presença do parâmetro `id` (prop passada pela página pai)
- Campos editáveis: `title`, `value`, `stage`, `notes`
- Campos não editáveis: `id`, `user_id`, `created_at`, `updated_at`
- Botão **"Cancelar"** redireciona para `/dashboard` em ambos os modos

---

## Fluxo de Autenticação

1. Usuário submete email/senha no `/login`
2. Supabase Auth valida credenciais e retorna sessão
3. Sessão armazenada em cookie via `@supabase/ssr` (token refresh automático pelo browser client)
4. Middleware Next.js valida sessão via `supabase.auth.getUser()` em cada requisição protegida
5. Logout limpa sessão e redireciona para `/login`

---

## Tratamento de Erros

- Login inválido: mensagem de erro exibida no formulário
- Falhas de rede: toast de erro na interface
- Campos obrigatórios: validação client-side antes de enviar
- Sessão expirada: redirecionamento automático para `/login`
- Deal não encontrado em `/deal/[id]`: redireciona para `/dashboard`
