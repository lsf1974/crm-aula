'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { Stage } from '@/types'

export async function createDeal(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const title = formData.get('title') as string
  const value = parseFloat(formData.get('value') as string)
  const stage = formData.get('stage') as Stage
  const notes = (formData.get('notes') as string) || null

  const { error } = await supabase.from('deals').insert({
    user_id: user.id,
    title,
    value,
    stage,
    notes,
  })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function updateDeal(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const title = formData.get('title') as string
  const value = parseFloat(formData.get('value') as string)
  const stage = formData.get('stage') as Stage
  const notes = (formData.get('notes') as string) || null

  const { error } = await supabase
    .from('deals')
    .update({ title, value, stage, notes })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/deal/${id}`)
  revalidatePath('/dashboard')
  return {}
}
