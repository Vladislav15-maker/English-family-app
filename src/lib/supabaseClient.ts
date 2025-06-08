import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase'; // Мы создадим этот файл позже

// Log the values as seen by the Node.js process (server-side)
console.log('[supabaseClient.ts] Attempting to read NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('[supabaseClient.ts] Attempting to read NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("[supabaseClient.ts] ERROR: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is undefined or empty.");
  throw new Error("Supabase URL is not defined. Make sure NEXT_PUBLIC_SUPABASE_URL is set in your .env.local or environment variables and the server was restarted.");
}
if (!supabaseAnonKey) {
  console.error("[supabaseClient.ts] ERROR: Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is undefined or empty.");
  throw new Error("Supabase anonymous key is not defined. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your .env.local or environment variables and the server was restarted.");
}

// Используем createBrowserClient из @supabase/ssr для клиентского компонента
// Для серверных компонентов или Route Handlers используйте createServerClient
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
