import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/LoginForm'

jest.mock('@/lib/actions/auth', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  forgotPassword: jest.fn(),
}))

import { signIn, signUp, forgotPassword } from '@/lib/actions/auth'
const mockSignIn = signIn as jest.Mock
const mockSignUp = signUp as jest.Mock
const mockForgotPassword = forgotPassword as jest.Mock

describe('LoginForm — modo login (padrão)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renderiza campos de email, senha e botão Entrar', () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument()
    // aba "Entrar" + botão submit "Entrar" — ambos existem no modo login
    const entrarBtns = screen.getAllByRole('button', { name: 'Entrar' })
    expect(entrarBtns.some(b => (b as HTMLButtonElement).type === 'submit')).toBe(true)
  })

  it('exibe link "Esqueci minha senha"', () => {
    render(<LoginForm />)
    expect(screen.getByText('Esqueci minha senha')).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando signIn retorna erro', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Email ou senha inválidos.' })
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitBtn = screen.getAllByRole('button', { name: 'Entrar' }).find(
      b => (b as HTMLButtonElement).type === 'submit'
    )!

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'wrong')
    await user.click(submitBtn)

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha inválidos.')
  })

  it('desabilita o botão enquanto o submit está pendente', async () => {
    mockSignIn.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitBtn = screen.getAllByRole('button', { name: 'Entrar' }).find(
      b => (b as HTMLButtonElement).type === 'submit'
    )!

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'pass')
    await user.click(submitBtn)

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
  })
})

describe('LoginForm — modo cadastrar', () => {
  beforeEach(() => jest.clearAllMocks())

  it('clicando na aba Cadastrar mostra campo confirmar senha e botão Criar conta', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByPlaceholderText('Confirmar senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('exibe mensagem de sucesso após cadastro bem-sucedido', async () => {
    mockSignUp.mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    await user.type(screen.getByPlaceholderText('Email'), 'novo@test.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'senha123')
    await user.type(screen.getByPlaceholderText('Confirmar senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Verifique seu email')
  })

  it('exibe mensagem de erro quando signUp retorna erro', async () => {
    mockSignUp.mockResolvedValueOnce({ error: 'As senhas não coincidem.' })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    await user.type(screen.getByPlaceholderText('Email'), 'novo@test.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'senha123')
    await user.type(screen.getByPlaceholderText('Confirmar senha'), 'diferente')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('As senhas não coincidem.')
  })
})

describe('LoginForm — modo esqueci minha senha', () => {
  beforeEach(() => jest.clearAllMocks())

  it('clicando em "Esqueci minha senha" mostra formulário de recuperação', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByText('Esqueci minha senha'))

    expect(screen.getByRole('button', { name: 'Enviar link' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Senha')).not.toBeInTheDocument()
  })

  it('exibe mensagem de sucesso após envio do email', async () => {
    mockForgotPassword.mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByText('Esqueci minha senha'))
    await user.type(screen.getByPlaceholderText('Email'), 'user@test.com')
    await user.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Link enviado')
  })

  it('"Voltar para o login" retorna ao modo login', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByText('Esqueci minha senha'))
    await user.click(screen.getByText('Voltar para o login'))

    const entrarBtns = screen.getAllByRole('button', { name: 'Entrar' })
    expect(entrarBtns.some(b => (b as HTMLButtonElement).type === 'submit')).toBe(true)
  })
})
