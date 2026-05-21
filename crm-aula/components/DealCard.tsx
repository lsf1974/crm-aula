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
