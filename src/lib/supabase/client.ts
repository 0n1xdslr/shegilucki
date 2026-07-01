import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  if (typeof window !== 'undefined') {
    console.log('Env variables starting with NEXT_PUBLIC:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')));
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
