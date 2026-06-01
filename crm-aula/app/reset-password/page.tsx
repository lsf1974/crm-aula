'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/lib/actions/auth'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const formData = new FormData(e.currentTarget)
    const result = await updatePassword(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm bg-white rounded-lg border p-8"
      >
        <h1 className="text-2xl font-bold">Nova senha</h1>
        <p className="text-sm text-gray-500">Escolha uma nova senha para sua conta.</p>

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <input
          type="password"
          name="password"
          placeholder="Nova senha"
          required
          minLength={6}
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmar nova senha"
          required
          minLength={6}
          className="border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {pending ? 'Salvando...' : 'Salvar nova senha'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-sm text-gray-500 hover:text-gray-800 text-center"
        >
          Voltar para o login
        </button>
      </form>
    </main>
  )
}
