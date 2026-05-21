import { render, screen } from '@testing-library/react'
import { DealForm } from '@/components/DealForm'
import type { Deal } from '@/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const mockDeal: Deal = {
  id: '1',
  user_id: 'u1',
  title: 'Meu Deal',
  value: 5000,
  stage: 'proposal',
  notes: 'Algumas notas',
  created_at: '',
  updated_at: '',
}

describe('DealForm', () => {
  it('modo criação: campos vazios e botão "Criar Deal"', () => {
    render(<DealForm onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Criar Deal' })).toBeInTheDocument()
    expect((screen.getByLabelText(/nome/i) as HTMLInputElement).value).toBe('')
  })

  it('modo edição: campos pré-preenchidos e botão "Salvar"', () => {
    render(<DealForm deal={mockDeal} onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Meu Deal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando onSubmit retorna erro', async () => {
    const { findByRole } = render(
      <DealForm
        onSubmit={jest.fn().mockResolvedValueOnce({ error: 'Erro de rede.' })}
      />
    )
    const button = screen.getByRole('button', { name: 'Criar Deal' })
    button.click()
    expect(await findByRole('alert')).toHaveTextContent('Erro de rede.')
  })

  it('botão "Cancelar" está presente em ambos os modos', () => {
    render(<DealForm onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})
