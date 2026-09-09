// api/gemini.js
//
// Säker server-funktion mot Googles Gemini API (gratis-nivå).
// Kräver att anroparen är inloggad — verifierar Supabase-sessionen
// innan den pratar med Gemini, så ingen utomstående kan använda din
// AI-budget genom att posta direkt till den här adressen. Loggar
// även varje lyckat anrop (vem + vilken funktion) för admin-vyns
// AI-kostnadsöversikt.
//
// Klienten skickar { system, text, image, mimeType, feature } plus
// en Authorization: Bearer <access_token>-header — den här funktionen
// bygger om det till Geminis format och lägger till nyckeln, som
// aldrig syns i webbläsaren.

import { createClient } from "@supabase/supabase-js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Endast POST är tillåtet" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Inloggning krävs för att använda AI-funktioner." });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase-konfiguration saknas på servern." });
  }

  // Skapar klienten med användarens egen token, så efterföljande anrop
  // (inklusive loggningen längre ner) körs som just den användaren och
  // respekterar Supabases RLS-regler korrekt.
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData?.user) {
    return res.status(401).json({ error: "Ogiltig eller utgången session. Logga in igen." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY saknas i miljövariablerna på servern." });
  }

  // Rate limiting: kollar mot loggen så ett enskilt konto inte kan
  // sköva AI-budgeten, även om det är inloggat på riktigt.
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [{ count: recentCount }, { count: dailyCount }] = await Promise.all([
    authClient
      .from("ai_call_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userData.user.id)
      .gte("created_at", oneMinuteAgo),
    authClient
      .from("ai_call_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userData.user.id)
      .gte("created_at", oneDayAgo),
  ]);

  if ((recentCount || 0) >= 10) {
    return res.status(429).json({ error: "För många förfrågningar just nu — vänta en liten stund och försök igen." });
  }
  if ((dailyCount || 0) >= 150) {
    return res.status(429).json({ error: "Du har nått dagens gräns för AI-funktioner. Försök igen imorgon." });
  }

  const { system, text, image, mimeType, feature } = req.body || {};

  const parts = [];
  if (text) parts.push({ text });
  if (image) parts.push({ inline_data: { mime_type: mimeType || "image/jpeg", data: image } });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.4 },
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({ error: data.error?.message || "Gemini-fel" });
    }

    authClient
      .from("ai_call_log")
      .insert({ user_id: userData.user.id, feature: feature || null })
      .then(({ error }) => {
        if (error) console.error("Kunde inte logga AI-anropet:", error.message);
      });

    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({ text: outputText });
  } catch (err) {
    res.status(500).json({ error: "Kunde inte nå Gemini", details: err.message });
  }
}
