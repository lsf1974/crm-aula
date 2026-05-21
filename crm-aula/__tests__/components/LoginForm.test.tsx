import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/LoginForm'

jest.mock('@/lib/actions/auth', () => ({
  signIn: jest.fn(),
}))

import { signIn } from '@/lib/actions/auth'
const mockSignIn = signIn as jest.Mock

describe('LoginForm', () => {
  it('renderiza campos de email, senha e botão de submit', () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando signIn retorna erro', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Email ou senha inválidos.' })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email ou senha inválidos.'
    )
  })

  it('desabilita o botão enquanto o submit está pendente', async () => {
    mockSignIn.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'pass')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
  })
})
