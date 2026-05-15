# CRM Login e Dashboard — Design Spec

**Data:** 2026-05-14  
**Status:** Aprovado

---

## Visão Geral

Sistema CRM de uso pessoal com autenticação por email/senha e dashboard de pipeline de vendas. Construído com Next.js 14, Supabase Auth e PostgreSQL.

---

## Arquitetura

- **Next.js 14** (App Router) — fullstack, rotas e API em um projeto único
- **Supabase Auth** — autenticação email/senha, sessão via cookie seguro (httpOnly)
- **Supabase PostgreSQL** — banco de dados gerenciado para oportunidades de venda
- **Tailwind CSS** — estilização moderna e responsiva
- **Middleware Next.js** — proteção de rotas, redireciona não autenticados para `/login`

---

## Páginas e Rotas

| Rota | Descrição | Acesso |
|---|---|---|
| `/login` | Formulário de login email/senha | Público |
| `/dashboard` | Métricas + Kanban de pipeline | Protegido |
| `/deal/[id]` | Detalhe e edição de oportunidade | Protegido |

Rotas protegidas redirecionam automaticamente para `/login` se não houver sessão ativa.

---

## Dashboard

### Cards de Métricas (topo)
- Total de deals ativos
- Valor total em pipeline (R$)
- Taxa de conversão (deals fechados / total)

### Quadro Kanban
4 colunas fixas representando as etapas do pipeline:
1. **Prospecção** (`prospecting`)
2. **Proposta** (`proposal`)
3. **Negociação** (`negotiation`)
4. **Fechado** (`closed`)

Cada deal exibe: nome, valor em R$, e botões para mover entre colunas.

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
| `created_at` | timestamp | Gerado automaticamente |

**Row Level Security (RLS):** ativado — cada usuário acessa apenas seus próprios deals.

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `LoginForm` | Formulário email/senha com validação e mensagem de erro |
| `MetricsCards` | 3 cards calculados dinamicamente dos deals |
| `KanbanBoard` | Renderiza as 4 colunas do pipeline |
| `DealCard` | Card compacto com nome, valor e ações |
| `DealDetail` | Formulário completo de edição da oportunidade |

---

## Fluxo de Autenticação

1. Usuário submete email/senha no `/login`
2. Supabase Auth valida credenciais e retorna sessão
3. Sessão armazenada em cookie seguro (httpOnly)
4. Middleware Next.js valida cookie em cada requisição protegida
5. Logout limpa sessão e redireciona para `/login`

---

## Tratamento de Erros

- Login inválido: mensagem de erro exibida no formulário
- Falhas de rede: toast de erro na interface
- Campos obrigatórios: validação client-side antes de enviar
- Sessão expirada: redirecionamento automático para `/login`
