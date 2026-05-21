# CRM Login e Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um CRM pessoal com autenticação email/senha e pipeline Kanban usando Next.js 14 App Router, Supabase Auth/PostgreSQL e Tailwind CSS.

**Architecture:** Server Components buscam dados e passam como props. Client Components (`'use client'`) tratam interatividade. Todas as mutações via Server Actions. Proteção de rotas pelo middleware do Next.js.

**Tech Stack:** Next.js 14.2+, TypeScript, Supabase JS v2 + @supabase/ssr, Tailwind CSS v3, Jest + React Testing Library.

---

## Mapa de Arquivos

Todos os caminhos são relativos a `crm-aula/`.

```
crm-aula/
├── .env.local                          # Credenciais Supabase (não commitar)
├── middleware.ts                       # Proteção de rotas
├── jest.config.ts                      # Configuração Jest
├── jest.setup.ts                       # Matchers jest-dom
├── supabase/
│   └── schema.sql                      # DDL completo da tabela deals
├── types/
│   └── index.ts                        # Deal, Stage, STAGES, STAGE_LABELS
├── lib/
│   ├── metrics.ts                      # metricsFromDeals() — função pura
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient (uso em Client Components)
│   │   └── server.ts                   # createServerClient com cookies (uso em Server Components/Actions)
│   └── actions/
│       ├── auth.ts                     # signIn, signOut
│       ├── deals.ts                    # createDeal, updateDeal
│       └── kanban.ts                   # moveStage
├── app/
│   ├── globals.css
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Redireciona para /dashboard ou /login
│   ├── login/page.tsx
│   ├── dashboard/page.tsx              # Busca deals + renderiza métricas + kanban
│   ├── deal/new/page.tsx
│   └── deal/[id]/page.tsx              # Busca deal por id, redireciona se não encontrado
└── components/
    ├── LoginForm.tsx                   # 'use client'
    ├── MetricsCards.tsx                # Server Component — recebe deals como prop
    ├── KanbanBoard.tsx                 # Server Component — renderiza 4 colunas
    ├── DealCard.tsx                    # 'use client' — useOptimistic para mover stage
    └── DealForm.tsx                    # 'use client' — cria e edita deal

Testes:
__tests__/
├── lib/metrics.test.ts
├── lib/actions/kanban-stages.test.ts
└── components/
    ├── LoginForm.test.tsx
    └── DealForm.test.tsx
```

---

## Task 1: Scaffold do projeto Next.js 14

**Files:**
- Modify: `crm-aula/package.json` (gerado pelo scaffold)
- Create: `crm-aula/jest.config.ts`
- Create: `crm-aula/jest.setup.ts`
- Create: `crm-aula/.env.local`

- [ ] **Step 1.1: Inicializar o projeto Next.js dentro de `crm-aula/`**

Execute a partir da pasta `desktop/aula/`:

```bash
cd crm-aula
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Saída esperada: arquivos gerados, incluindo `package.json`, `app/`, `tailwind.config.ts`, `tsconfig.json`.

- [ ] **Step 1.2: Instalar dependências Supabase**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Saída esperada: adicionado `@supabase/supabase-js` e `@supabase/ssr` ao `package.json`.

- [ ] **Step 1.3: Instalar dependências de teste**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

- [ ] **Step 1.4: Criar `jest.config.ts`**

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

- [ ] **Step 1.5: Criar `jest.setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 1.6: Adicionar script de teste ao `package.json`**

No `package.json`, na seção `"scripts"`, adicione:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 1.7: Criar `.env.local` (nunca commitar este arquivo)**

```
NEXT_PUBLIC_SUPABASE_URL=https://<SEU-PROJECT>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUA-ANON-KEY>
```

Preencha com as credenciais do seu projeto Supabase (Settings → API no dashboard).

- [ ] **Step 1.8: Verificar que Jest roda**

```bash
npx jest --passWithNoTests
```

Saída esperada: `Test Suites: 0 passed` sem erros.

- [ ] **Step 1.9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 project with Supabase and Jest"
```

---

## Task 2: Types e função de métricas (TDD)

**Files:**
- Create: `types/index.ts`
- Create: `lib/metrics.ts`
- Create: `__tests__/lib/metrics.test.ts`

- [ ] **Step 2.1: Escrever o teste de `metricsFromDeals` (falha esperada)**

Crie `__tests__/lib/metrics.test.ts`:

```ts
import { metricsFromDeals } from '@/lib/metrics'
import type { Deal } from '@/types'

const makeDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: '1',
  user_id: 'u1',
  title: 'Test Deal',
  value: 1000,
  stage: 'prospecting',
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

describe('metricsFromDeals', () => {
  it('retorna zeros para array vazio', () => {
    expect(metricsFromDeals([])).toEqual({
      activeDeals: 0,
      pipelineValue: 0,
      conversionRate: 0,
    })
  })

  it('conta deals com stage != closed como ativos', () => {
    const deals = [
      makeDeal({ stage: 'prospecting' }),
      makeDeal({ stage: 'proposal' }),
      makeDeal({ stage: 'closed' }),
    ]
    expect(metricsFromDeals(deals).activeDeals).toBe(2)
  })

  it('soma valor apenas dos deals ativos no pipeline', () => {
    const deals = [
      makeDeal({ value: 1000, stage: 'prospecting' }),
      makeDeal({ value: 500, stage: 'closed' }),
    ]
    expect(metricsFromDeals(deals).pipelineValue).toBe(1000)
  })

  it('calcula taxa de conversão como (closed / total) * 100', () => {
    const deals = [
      makeDeal({ stage: 'closed' }),
      makeDeal({ stage: 'prospecting' }),
      makeDeal({ stage: 'closed' }),
    ]
    expect(metricsFromDeals(deals).conversionRate).toBeCloseTo(66.67, 1)
  })
})
```

- [ ] **Step 2.2: Rodar o teste para confirmar falha**

```bash
npx jest __tests__/lib/metrics.test.ts
```

Saída esperada: `FAIL` — "Cannot find module '@/lib/metrics'".

- [ ] **Step 2.3: Criar `types/index.ts`**

```ts
export type Stage = 'prospecting' | 'proposal' | 'negotiation' | 'closed'

export const STAGES: Stage[] = ['prospecting', 'proposal', 'negotiation', 'closed']

export const STAGE_LABELS: Record<Stage, string> = {
  prospecting: 'Prospecção',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closed: 'Fechado',
}

export interface Deal {
  id: string
  user_id: string
  title: string
  value: number
  stage: Stage
  notes: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2.4: Criar `lib/metrics.ts`**

```ts
import type { Deal } from '@/types'

export interface Metrics {
  activeDeals: number
  pipelineValue: number
  conversionRate: number
}

export function metricsFromDeals(deals: Deal[]): Metrics {
  const activeDeals = deals.filter(d => d.stage !== 'closed').length
  const pipelineValue = deals
    .filter(d => d.stage !== 'closed')
    .reduce((sum, d) => sum + Number(d.value), 0)
  const conversionRate =
    deals.length > 0
      ? (deals.filter(d => d.stage === 'closed').length / deals.length) * 100
      : 0

  return { activeDeals, pipelineValue, conversionRate }
}
```

- [ ] **Step 2.5: Rodar o teste para confirmar aprovação**

```bash
npx jest __tests__/lib/metrics.test.ts
```

Saída esperada: `PASS` — 4 testes aprovados.

- [ ] **Step 2.6: Commit**

```bash
git add types/index.ts lib/metrics.ts __tests__/lib/metrics.test.ts
git commit -m "feat: add Deal types, STAGES constant, and metricsFromDeals utility"
```

---

## Task 3: Schema SQL do banco de dados

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 3.1: Criar `supabase/schema.sql`**

```sql
-- Extensão para auto-update de updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Tabela principal
CREATE TABLE deals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  value       NUMERIC NOT NULL DEFAULT 0,
  stage       TEXT NOT NULL DEFAULT 'prospecting',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Constraint de valores válidos para stage
ALTER TABLE deals
  ADD CONSTRAINT deals_stage_check
  CHECK (stage IN ('prospecting', 'proposal', 'negotiation', 'closed'));

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Row Level Security: cada usuário acessa apenas seus próprios deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_deals" ON deals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 3.2: Executar o SQL no Supabase**

No dashboard do Supabase: abra **SQL Editor** e cole o conteúdo de `supabase/schema.sql`. Clique em **Run**.

Resultado esperado: tabela `deals` criada, trigger ativo, RLS habilitado.

- [ ] **Step 3.3: Commit**

```bash
git add supabase/schema.sql
git commit -m "chore: add deals table schema with RLS and stage constraint"
```

---

## Task 4: Supabase client utilities

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`

- [ ] **Step 4.1: Criar `lib/supabase/server.ts`**

Usado em Server Components, Server Actions e middleware — lê/escreve cookies da requisição.

```ts
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll pode falhar em Server Components read-only — seguro ignorar
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4.2: Criar `lib/supabase/client.ts`**

Usado em Client Components para operações que não precisam de SSR.

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4.3: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase server and browser client utilities"
```

---

## Task 5: Middleware de proteção de rotas

**Files:**
- Create: `middleware.ts`

- [ ] **Step 5.1: Criar `middleware.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 5.2: Testar manualmente**

Suba o servidor: `npm run dev`. Acesse `http://localhost:3000/dashboard` sem estar logado.

Resultado esperado: redirecionado para `/login`.

- [ ] **Step 5.3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add Next.js middleware for route protection"
```

---

## Task 6: Server Actions de autenticação + LoginForm (TDD)

**Files:**
- Create: `lib/actions/auth.ts`
- Create: `components/LoginForm.tsx`
- Create: `__tests__/components/LoginForm.test.tsx`

- [ ] **Step 6.1: Escrever o teste do LoginForm (falha esperada)**

Crie `__tests__/components/LoginForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/LoginForm'

jest.mock('@/lib/actions/auth', () => ({
  signIn: jest.fn(),
}))

import { signIn } from '@/lib/actions/auth'
const mockSignIn = signIn as jest.Mock

describe('LoginForm', () => {
  it('renderiza campos de email, senha e botão de submit', () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando signIn retorna erro', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Email ou senha inválidos.' })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email ou senha inválidos.'
    )
  })

  it('desabilita o botão enquanto o submit está pendente', async () => {
    mockSignIn.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'pass')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
  })
})
```

- [ ] **Step 6.2: Rodar o teste para confirmar falha**

```bash
npx jest __tests__/components/LoginForm.test.tsx
```

Saída esperada: `FAIL` — "Cannot find module '@/components/LoginForm'".

- [ ] **Step 6.3: Criar `lib/actions/auth.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function signIn(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Email ou senha inválidos.' }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 6.4: Criar `components/LoginForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { signIn } from '@/lib/actions/auth'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setPending(true)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">CRM Login</h1>
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="border rounded px-3 py-2"
      />
      <input
        type="password"
        name="password"
        placeholder="Senha"
        required
        className="border rounded px-3 py-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {pending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 6.5: Rodar o teste para confirmar aprovação**

```bash
npx jest __tests__/components/LoginForm.test.tsx
```

Saída esperada: `PASS` — 3 testes aprovados.

- [ ] **Step 6.6: Commit**

```bash
git add lib/actions/auth.ts components/LoginForm.tsx __tests__/components/LoginForm.test.tsx
git commit -m "feat: add auth server actions and LoginForm component"
```

---

## Task 7: Páginas de login e root redirect

**Files:**
- Create: `app/login/page.tsx`
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 7.1: Criar `app/login/page.tsx`**

```tsx
import { LoginForm } from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoginForm />
    </main>
  )
}
```

- [ ] **Step 7.2: Atualizar `app/layout.tsx`**

Substitua o conteúdo gerado pelo scaffold:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRM',
  description: 'Pipeline de vendas pessoal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 7.3: Criar `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  redirect(user ? '/dashboard' : '/login')
}
```

- [ ] **Step 7.4: Testar o fluxo de login manualmente**

Com `npm run dev`:
1. Acesse `http://localhost:3000` → deve redirecionar para `/login`.
2. Faça login com um usuário existente no Supabase → deve redirecionar para `/dashboard` (página ainda não existe, erro 404 é esperado).
3. Acesse `/login` já autenticado → deve redirecionar para `/dashboard`.

- [ ] **Step 7.5: Commit**

```bash
git add app/login/page.tsx app/layout.tsx app/page.tsx
git commit -m "feat: add login page and root redirect"
```

---

## Task 8: Dashboard page + MetricsCards (TDD)

**Files:**
- Create: `components/MetricsCards.tsx`
- Create: `app/dashboard/page.tsx`

- [ ] **Step 8.1: Criar `components/MetricsCards.tsx`**

```tsx
import { metricsFromDeals } from '@/lib/metrics'
import type { Deal } from '@/types'

interface Props {
  deals: Deal[]
}

export function MetricsCards({ deals }: Props) {
  const { activeDeals, pipelineValue, conversionRate } = metricsFromDeals(deals)

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded border p-4">
        <p className="text-sm text-gray-500">Deals ativos</p>
        <p className="text-3xl font-bold">{activeDeals}</p>
      </div>
      <div className="bg-white rounded border p-4">
        <p className="text-sm text-gray-500">Pipeline total</p>
        <p className="text-3xl font-bold">
          {pipelineValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </p>
      </div>
      <div className="bg-white rounded border p-4">
        <p className="text-sm text-gray-500">Taxa de conversão</p>
        <p className="text-3xl font-bold">{conversionRate.toFixed(1)}%</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 8.2: Criar `app/dashboard/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { MetricsCards } from '@/components/MetricsCards'
import { KanbanBoard } from '@/components/KanbanBoard'
import { signOut } from '@/lib/actions/auth'
import type { Deal } from '@/types'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <div className="flex gap-3 items-center">
          <Link
            href="/deal/new"
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm"
          >
            + Novo Deal
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Sair
            </button>
          </form>
        </div>
      </div>

      <MetricsCards deals={(deals as Deal[]) ?? []} />
      <KanbanBoard deals={(deals as Deal[]) ?? []} />
    </main>
  )
}
```

Nota: o `KanbanBoard` será criado na próxima task. O TypeScript vai reclamar até lá.

- [ ] **Step 8.3: Commit**

```bash
git add components/MetricsCards.tsx app/dashboard/page.tsx
git commit -m "feat: add dashboard page and MetricsCards component"
```

---

## Task 9: KanbanBoard + DealCard (leitura, sem moves)

**Files:**
- Create: `components/KanbanBoard.tsx`
- Create: `components/DealCard.tsx`

- [ ] **Step 9.1: Criar `components/KanbanBoard.tsx`**

```tsx
import { DealCard } from './DealCard'
import type { Deal } from '@/types'
import { STAGES, STAGE_LABELS } from '@/types'

interface Props {
  deals: Deal[]
}

export function KanbanBoard({ deals }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {STAGES.map(stage => (
        <div key={stage} className="flex flex-col gap-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">
            {STAGE_LABELS[stage]}
          </h3>
          <div className="flex flex-col gap-2 min-h-[100px]">
            {deals
              .filter(d => d.stage === stage)
              .map(deal => (
                <DealCard key={deal.id} deal={deal} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 9.2: Criar `components/DealCard.tsx` (versão inicial — sem moves)**

```tsx
'use client'

import Link from 'next/link'
import type { Deal } from '@/types'

interface Props {
  deal: Deal
}

export function DealCard({ deal }: Props) {
  return (
    <div className="bg-white rounded border p-3 flex flex-col gap-2">
      <Link href={`/deal/${deal.id}`} className="font-medium hover:underline text-sm">
        {deal.title}
      </Link>
      <p className="text-sm text-gray-600">
        {Number(deal.value).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      </p>
    </div>
  )
}
```

- [ ] **Step 9.3: Verificar no browser**

Com `npm run dev`, acesse `/dashboard` logado. As 4 colunas Kanban devem aparecer (vazias se não há deals, ou com os deals existentes).

- [ ] **Step 9.4: Commit**

```bash
git add components/KanbanBoard.tsx components/DealCard.tsx
git commit -m "feat: add KanbanBoard and DealCard (read-only)"
```

---

## Task 10: moveStage Server Action + DealCard com moves otimistas (TDD)

**Files:**
- Create: `lib/actions/kanban.ts`
- Create: `__tests__/lib/actions/kanban-stages.test.ts`
- Modify: `components/DealCard.tsx`

- [ ] **Step 10.1: Escrever o teste da validação de stage (falha esperada)**

Crie `__tests__/lib/actions/kanban-stages.test.ts`:

```ts
import { STAGES } from '@/types'

describe('STAGES constant', () => {
  it('contém 4 stages válidos na ordem correta', () => {
    expect(STAGES).toEqual([
      'prospecting',
      'proposal',
      'negotiation',
      'closed',
    ])
  })

  it('stage inválido não está em STAGES', () => {
    expect(STAGES.includes('invalid' as never)).toBe(false)
  })

  it('primeiro stage não tem predecesssor', () => {
    expect(STAGES.indexOf('prospecting')).toBe(0)
  })

  it('último stage não tem sucessor', () => {
    expect(STAGES.indexOf('closed')).toBe(STAGES.length - 1)
  })
})
```

- [ ] **Step 10.2: Rodar o teste para confirmar aprovação (já temos STAGES)**

```bash
npx jest __tests__/lib/actions/kanban-stages.test.ts
```

Saída esperada: `PASS` — 4 testes aprovados (STAGES já existe em `types/index.ts`).

- [ ] **Step 10.3: Criar `lib/actions/kanban.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { STAGES } from '@/types'

export async function moveStage(dealId: string, newStage: string): Promise<void> {
  if (!STAGES.includes(newStage as never)) {
    throw new Error('Invalid stage')
  }

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('deals')
    .update({ stage: newStage })
    .eq('id', dealId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}
```

- [ ] **Step 10.4: Atualizar `components/DealCard.tsx` com moves otimistas**

Substitua o conteúdo inteiro:

```tsx
'use client'

import { useOptimistic, useTransition, useState } from 'react'
import Link from 'next/link'
import { moveStage } from '@/lib/actions/kanban'
import type { Deal, Stage } from '@/types'
import { STAGES } from '@/types'

interface Props {
  deal: Deal
}

export function DealCard({ deal }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [optimisticStage, setOptimisticStage] = useOptimistic<Stage, Stage>(
    deal.stage,
    (_, newStage) => newStage
  )

  const stageIndex = STAGES.indexOf(optimisticStage)

  function handleMove(direction: 'back' | 'forward') {
    const newIndex =
      direction === 'forward' ? stageIndex + 1 : stageIndex - 1
    const newStage = STAGES[newIndex]

    startTransition(async () => {
      setOptimisticStage(newStage)
      try {
        await moveStage(deal.id, newStage)
        setError(null)
      } catch {
        setError('Falha ao mover deal. Tente novamente.')
      }
    })
  }

  return (
    <div className="bg-white rounded border p-3 flex flex-col gap-2">
      <Link
        href={`/deal/${deal.id}`}
        className="font-medium hover:underline text-sm"
      >
        {deal.title}
      </Link>
      <p className="text-sm text-gray-600">
        {Number(deal.value).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      </p>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={stageIndex === 0 || isPending}
          onClick={() => handleMove('back')}
          className="text-xs border rounded px-2 py-1 disabled:opacity-40 hover:bg-gray-50"
        >
          ← Voltar
        </button>
        <button
          disabled={stageIndex === STAGES.length - 1 || isPending}
          onClick={() => handleMove('forward')}
          className="text-xs border rounded px-2 py-1 disabled:opacity-40 hover:bg-gray-50"
        >
          Avançar →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 10.5: Testar moves no browser**

No Kanban, clique em "Avançar →" num deal. O card deve mover para a próxima coluna imediatamente (otimista) e persistir após recarregar a página.

- [ ] **Step 10.6: Rodar todos os testes**

```bash
npx jest
```

Saída esperada: todos `PASS`.

- [ ] **Step 10.7: Commit**

```bash
git add lib/actions/kanban.ts components/DealCard.tsx __tests__/lib/actions/kanban-stages.test.ts
git commit -m "feat: add moveStage server action and optimistic Kanban moves"
```

---

## Task 11: DealForm component (TDD)

**Files:**
- Create: `components/DealForm.tsx`
- Create: `__tests__/components/DealForm.test.tsx`

- [ ] **Step 11.1: Escrever o teste do DealForm (falha esperada)**

Crie `__tests__/components/DealForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { DealForm } from '@/components/DealForm'
import type { Deal } from '@/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const mockDeal: Deal = {
  id: '1',
  user_id: 'u1',
  title: 'Meu Deal',
  value: 5000,
  stage: 'proposal',
  notes: 'Algumas notas',
  created_at: '',
  updated_at: '',
}

describe('DealForm', () => {
  it('modo criação: campos vazios e botão "Criar Deal"', () => {
    render(<DealForm onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Criar Deal' })).toBeInTheDocument()
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('')
  })

  it('modo edição: campos pré-preenchidos e botão "Salvar"', () => {
    render(<DealForm deal={mockDeal} onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Meu Deal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando onSubmit retorna erro', async () => {
    const { findByRole } = render(
      <DealForm
        onSubmit={jest.fn().mockResolvedValueOnce({ error: 'Erro de rede.' })}
      />
    )
    const button = screen.getByRole('button', { name: 'Criar Deal' })
    button.click()
    expect(await findByRole('alert')).toHaveTextContent('Erro de rede.')
  })

  it('botão "Cancelar" está presente em ambos os modos', () => {
    render(<DealForm onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 11.2: Rodar o teste para confirmar falha**

```bash
npx jest __tests__/components/DealForm.test.tsx
```

Saída esperada: `FAIL` — "Cannot find module '@/components/DealForm'".

- [ ] **Step 11.3: Criar `components/DealForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Deal } from '@/types'
import { STAGES, STAGE_LABELS } from '@/types'

interface Props {
  deal?: Deal
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>
}

export function DealForm({ deal, onSubmit }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setPending(true)
    const result = await onSubmit(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Nome *
        </label>
        <input
          id="title"
          name="title"
          defaultValue={deal?.title}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium mb-1">
          Valor (R$) *
        </label>
        <input
          id="value"
          name="value"
          type="number"
          step="0.01"
          min="0"
          defaultValue={deal?.value}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="stage" className="block text-sm font-medium mb-1">
          Stage *
        </label>
        <select
          id="stage"
          name="stage"
          defaultValue={deal?.stage ?? 'prospecting'}
          className="w-full border rounded px-3 py-2"
        >
          {STAGES.map(s => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={deal?.notes ?? ''}
          rows={3}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {pending ? 'Salvando...' : deal ? 'Salvar' : 'Criar Deal'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="border rounded px-4 py-2 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 11.4: Rodar o teste para confirmar aprovação**

```bash
npx jest __tests__/components/DealForm.test.tsx
```

Saída esperada: `PASS` — 4 testes aprovados.

- [ ] **Step 11.5: Commit**

```bash
git add components/DealForm.tsx __tests__/components/DealForm.test.tsx
git commit -m "feat: add DealForm component (create/edit dual mode)"
```

---

## Task 12: Página /deal/new

**Files:**
- Create: `lib/actions/deals.ts`
- Create: `app/deal/new/page.tsx`

- [ ] **Step 12.1: Criar `lib/actions/deals.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Stage } from '@/types'

export async function createDeal(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const title = formData.get('title') as string
  const value = parseFloat(formData.get('value') as string)
  const stage = formData.get('stage') as Stage
  const notes = (formData.get('notes') as string) || null

  const { error } = await supabase.from('deals').insert({
    user_id: user.id,
    title,
    value,
    stage,
    notes,
  })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function updateDeal(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const title = formData.get('title') as string
  const value = parseFloat(formData.get('value') as string)
  const stage = formData.get('stage') as Stage
  const notes = (formData.get('notes') as string) || null

  const { error } = await supabase
    .from('deals')
    .update({ title, value, stage, notes })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/deal/${id}`)
  revalidatePath('/dashboard')
  return {}
}
```

- [ ] **Step 12.2: Criar `app/deal/new/page.tsx`**

```tsx
import { createDeal } from '@/lib/actions/deals'
import { DealForm } from '@/components/DealForm'

export default function NewDealPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Novo Deal</h1>
      <DealForm onSubmit={createDeal} />
    </main>
  )
}
```

- [ ] **Step 12.3: Testar no browser**

Acesse `/deal/new`. Preencha o formulário e submeta. Deve redirecionar para `/dashboard` com o novo deal na coluna correta do Kanban.

- [ ] **Step 12.4: Commit**

```bash
git add lib/actions/deals.ts app/deal/new/page.tsx
git commit -m "feat: add createDeal action and /deal/new page"
```

---

## Task 13: Página /deal/[id] (edição)

**Files:**
- Create: `app/deal/[id]/page.tsx`

- [ ] **Step 13.1: Criar `app/deal/[id]/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { DealForm } from '@/components/DealForm'
import { updateDeal } from '@/lib/actions/deals'
import type { Deal } from '@/types'

interface Props {
  params: { id: string }
}

export default async function DealDetailPage({ params }: Props) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!deal) redirect('/dashboard')

  const boundUpdate = updateDeal.bind(null, params.id)

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Deal</h1>
      <DealForm deal={deal as Deal} onSubmit={boundUpdate} />
    </main>
  )
}
```

- [ ] **Step 13.2: Testar no browser**

1. No Kanban, clique no nome de um deal → deve ir para `/deal/[id]` com os campos preenchidos.
2. Altere o título e salve → deve permanecer na página com os dados atualizados.
3. Clique em "Cancelar" → deve voltar para `/dashboard`.
4. Acesse `/deal/id-invalido` → deve redirecionar para `/dashboard`.

- [ ] **Step 13.3: Rodar todos os testes**

```bash
npx jest
```

Saída esperada: todos `PASS`.

- [ ] **Step 13.4: Commit final**

```bash
git add app/deal/
git commit -m "feat: add /deal/[id] edit page"
```

---

## Verificação Final

- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem erros  
- [ ] `npx jest` — todos os testes passam
- [ ] Fluxo completo manual:
  1. Logout → redireciona para `/login`
  2. Login com email/senha inválidos → mensagem de erro
  3. Login com credenciais válidas → `/dashboard`
  4. Criar deal via "+ Novo Deal" → aparece no Kanban
  5. Mover deal no Kanban (← Voltar / Avançar →) → move otimisticamente, persiste após F5
  6. Clicar no deal → editar e salvar → campos atualizados
  7. Métricas calculadas corretamente (ativos, pipeline, conversão)
