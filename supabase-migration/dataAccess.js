// dataAccess.js
//
// Exempel på hur dagens window.storage-anrop ersätts med riktiga
// Supabase-frågor. Mönstret är detsamma för resten av appens data
// (vatten, träning, vikt, fasta, livsmedelsbibliotek) — byt bara
// tabellnamn och kolumner enligt schema.sql.

import { supabase } from "./supabaseClient";

// ============================================================
// FÖRE (nuvarande artefakt):
//   await window.storage.get(STORAGE_PREFIX + date, false)
//   await window.storage.set(STORAGE_PREFIX + date, JSON.stringify(data), false)
//
// EFTER (Supabase):
// ============================================================

// Hämta alla måltider för en viss dag
export async function fetchMealsForDate(userId, date) {
  const { data, error } = await supabase
    .from("meal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", date)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Bygg om till samma form som appen redan använder internt:
  // { breakfast: [...], lunch: [...], snack: [...], dinner: [...], other: [...] }
  const grouped = { breakfast: [], lunch: [], snack: [], dinner: [], other: [] };
  data.forEach((row) => {
    grouped[row.category].push({
      id: row.id,
      name: row.name,
      kcal: row.kcal,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
      co2: row.co2_kg,
      cost: row.cost_sek,
      portion_note: row.portion_note,
      image: row.image_url,
      emoji: row.emoji,
    });
  });
  return grouped;
}

// Lägg till en ny måltid
export async function addMealEntry(userId, date, category, entry) {
  const { data, error } = await supabase
    .from("meal_entries")
    .insert({
      user_id: userId,
      log_date: date,
      category,
      name: entry.name,
      kcal: entry.kcal,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
      co2_kg: entry.co2,
      cost_sek: entry.cost,
      portion_note: entry.portion_note,
      image_url: entry.image, // OBS: ladda upp bilder till Supabase Storage istället för base64 i databasen
      emoji: entry.emoji,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Uppdatera en befintlig måltid (redigera-flödet)
export async function updateMealEntry(entryId, changes) {
  const { error } = await supabase.from("meal_entries").update(changes).eq("id", entryId);
  if (error) throw error;
}

// Ta bort en måltid
export async function deleteMealEntry(entryId) {
  const { error } = await supabase.from("meal_entries").delete().eq("id", entryId);
  if (error) throw error;
}

// ============================================================
// Profil / mål — motsvarar profile-fönstret på "Daglig budget"
// ============================================================

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data; // null om profilen inte finns ännu
}

export async function saveProfile(userId, profile) {
  const { error } = await supabase.from("profiles").upsert({ user_id: userId, ...profile });
  if (error) throw error;
}

// ============================================================
// Bilder — base64 fungerar för en artefakt, men blir tungt i en
// riktig databas. Ladda istället upp till Supabase Storage:
// ============================================================

export async function uploadMealImage(userId, file) {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("meal-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("meal-images").getPublicUrl(path);
  return data.publicUrl; // spara denna URL i image_url-kolumnen ovan
}
