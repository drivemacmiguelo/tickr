import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://wkzramyvetbmbgijxauu.supabase.co'
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_z-o58nnb0yKylcXsAx1a-Q_s0O-63ZX'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}
