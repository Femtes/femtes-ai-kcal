// supabaseClient.js
//
// Kör `npm install @supabase/supabase-js` i ditt riktiga projekt
// (Vercel/Vite/Next.js osv.) — detta paket finns INTE i Claude-artefakter,
// så den här filen är till för när du flyttat ut koden.
//
// Lägg din URL och anon-nyckel i miljövariabler, aldrig hårdkodat i git.
// I Vite: .env.local -> VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// I Next.js: .env.local -> NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // motsvarar "Kom ihåg mig"
    autoRefreshToken: true,
  },
});
