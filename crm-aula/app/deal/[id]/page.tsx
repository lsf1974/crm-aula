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
