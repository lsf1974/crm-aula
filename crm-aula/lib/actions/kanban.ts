'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { STAGES } from '@/types'

export async function moveStage(dealId: string, newStage: string): Promise<void> {
  if (!STAGES.includes(newStage as never)) {
    throw new Error('Invalid stage')
  }

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('deals')
    .update({ stage: newStage })
    .eq('id', dealId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}
