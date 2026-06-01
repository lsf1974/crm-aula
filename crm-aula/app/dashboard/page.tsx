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
