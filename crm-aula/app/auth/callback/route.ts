import { createServerClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | null
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Prevent open redirect: only allow relative paths, block protocol-relative URLs
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\')
    ? rawNext
    : '/dashboard'

  if (token_hash && type) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invalid-link`)
}
