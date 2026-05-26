'use client'

import { useState } from 'react'
import { signIn, signUp, forgotPassword } from '@/lib/actions/auth'

type Mode = 'login' | 'register' | 'forgot'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)

    const formData = new FormData(e.currentTarget)
    let result: { error?: string; success?: boolean } | void

    if (mode === 'login') {
      result = await signIn(formData)
    } else if (mode === 'register') {
      result = await signUp(formData)
    } else {
      result = await forgotPassword(formData)
    }

    setPending(false)

    if (result?.error) {
      setError(result.error)
    } else if (mode === 'register' && result?.success) {
      setSuccess('Verifique seu email para confirmar a conta.')
    } else if (mode === 'forgot' && result?.success) {
      setSuccess('Link enviado! Verifique seu email.')
    }
  }

  if (mode === 'forgot') {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm bg-white rounded-lg border p-8"
      >
        <h1 className="text-2xl font-bold">Redefinir senha</h1>
        <p className="text-sm text-gray-500">
          Informe seu email e enviaremos um link para criar uma nova senha.
        </p>

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}
        {success && (
          <p role="alert" className="text-green-600 text-sm">
            {success}
          </p>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {pending ? 'Enviando...' : 'Enviar link'}
        </button>

        <button
          type="button"
          onClick={() => switchMode('login')}
          className="text-sm text-blue-600 hover:underline text-center"
        >
          Voltar para o login
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm bg-white rounded-lg border p-8"
    >
      {/* Abas */}
      <div className="flex border-b border-gray-200 -mx-8 px-8 mb-2">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            mode === 'login'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            mode === 'register'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Cadastrar
        </button>
      </div>

      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      {success && (
        <p role="alert" className="text-green-600 text-sm">
          {success}
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
        minLength={6}
        className="border rounded px-3 py-2"
      />

      {mode === 'register' && (
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmar senha"
          required
          minLength={6}
          className="border rounded px-3 py-2"
        />
      )}

      {mode === 'login' && (
        <button
          type="button"
          onClick={() => switchMode('forgot')}
          className="text-right text-sm text-blue-600 hover:underline"
        >
          Esqueci minha senha
        </button>
      )}

      {mode === 'register' && (
        <p className="text-xs text-gray-500">
          Você receberá um email de confirmação.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {pending
          ? mode === 'login' ? 'Entrando...' : 'Salvando...'
          : mode === 'login' ? 'Entrar' : 'Criar conta'}
      </button>
    </form>
  )
}
