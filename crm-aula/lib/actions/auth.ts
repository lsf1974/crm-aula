'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function signIn(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Email ou senha inválidos.' }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
