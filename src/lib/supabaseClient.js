import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase-nycklar saknas. Skapa en .env.local med VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY (se .env.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // sparar sessionen i webbläsaren, håller användaren inloggad
    autoRefreshToken: true, // förnyar sessionen automatiskt i bakgrunden, ingen ny inloggning behövs
  },
});
