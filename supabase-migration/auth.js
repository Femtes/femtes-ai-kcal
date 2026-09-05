// auth.js
//
// Ersätter den lokala "låtsas-inloggningen". De här funktionerna ger
// riktiga hashade lösenord, riktiga sessioner och riktiga mejl
// (verifiering + återställning) helt hanterat av Supabase.
//
// Kom ihåg: aktivera "Confirm email" under Authentication -> Settings
// i Supabase-projektet om du vill ha verifieringsmejl vid registrering.

import { supabase } from "./supabaseClient";

// --- Registrera nytt konto ---
// Motsvarar formuläret: e-post, lösenord, bekräfta lösenord, godkänn villkor.
export async function registerAccount(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin, // vart länken i mejlet ska peka
    },
  });
  if (error) throw error;
  // data.user finns direkt, men är inte "confirmed" förrän länken i mejlet klickats
  return data;
}

// --- Logga in ---
export async function loginWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// --- Logga ut ---
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// --- Glömt lösenord ---
// Skickar ett riktigt återställningsmejl med en säker länk.
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

// --- Sätt nytt lösenord (anropas på /reset-password efter att länken klickats) ---
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// --- Hämta nuvarande inloggad användare (t.ex. vid appstart) ---
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session; // null om ingen är inloggad
}

// --- Lyssna på inloggning/utloggning i realtid ---
// Användning: const unsubscribe = onAuthChange((session) => { ... });
export function onAuthChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => listener.subscription.unsubscribe();
}
