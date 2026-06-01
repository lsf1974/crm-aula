import { STAGES } from '@/types'

describe('STAGES constant', () => {
  it('contém 4 stages válidos na ordem correta', () => {
    expect(STAGES).toEqual([
      'prospecting',
      'proposal',
      'negotiation',
      'closed',
    ])
  })

  it('stage inválido não está em STAGES', () => {
    expect(STAGES.includes('invalid' as never)).toBe(false)
  })

  it('primeiro stage não tem predecessor', () => {
    expect(STAGES.indexOf('prospecting')).toBe(0)
  })

  it('último stage não tem sucessor', () => {
    expect(STAGES.indexOf('closed')).toBe(STAGES.length - 1)
  })
})
