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
