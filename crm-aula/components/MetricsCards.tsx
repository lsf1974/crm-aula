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
