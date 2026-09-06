// storagePolyfill.js
//
// Portion.jsx anropar `window.storage.get/set/delete/list`. Den här
// filen implementerar samma API men mot en riktig Supabase-tabell
// (app_storage) istället för webbläsarens localStorage — så all data
// (mål, måltider, vikt, träning, fasta, bibliotek osv.) sparas på
// kontot i molnet och ligger kvar oavsett vilken enhet, webbläsare
// eller driftsättning man använder.
//
// Kör supabase-migration/app_storage.sql i Supabase SQL Editor innan
// du använder appen, annars finns tabellen inte.

import { supabase } from "./supabaseClient";

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

window.storage = {
  async get(key, shared = false) {
    const userId = await getUserId();
    let query = supabase.from("app_storage").select("value").eq("key", key).eq("shared", shared);
    if (!shared) query = query.eq("user_id", userId);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error(`Key not found: ${key}`);
    }
    return { key, value: data.value, shared };
  },

  async set(key, value, shared = false) {
    const userId = await getUserId();
    const match = shared ? { key, shared: true } : { key, shared: false, user_id: userId };

    const { data: existing, error: findError } = await supabase
      .from("app_storage")
      .select("id")
      .match(match)
      .maybeSingle();
    if (findError) throw findError;

    if (existing) {
      const { error: updateError } = await supabase
        .from("app_storage")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("app_storage").insert({
        key,
        value,
        shared,
        user_id: userId,
      });
      if (insertError) throw insertError;
    }

    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const userId = await getUserId();
    const match = shared ? { key, shared: true } : { key, shared: false, user_id: userId };
    const { error } = await supabase.from("app_storage").delete().match(match);
    if (error) throw error;
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    const userId = await getUserId();
    let query = supabase.from("app_storage").select("key").ilike("key", `${prefix}%`).eq("shared", shared);
    if (!shared) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;
    return { keys: (data || []).map((row) => row.key), prefix, shared };
  },
};
