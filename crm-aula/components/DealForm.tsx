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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const formData = new FormData(e.currentTarget)
    const result = await onSubmit(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
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
