import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for server client.')
}

// Server-side client — bypasses RLS, never exposed to browser
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)