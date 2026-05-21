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
