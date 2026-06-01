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
