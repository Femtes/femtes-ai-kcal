// api/gemini.js
//
// Säker server-funktion mot Googles Gemini API (gratis-nivå).
// Kräver att anroparen är inloggad — verifierar Supabase-sessionen
// innan den pratar med Gemini, så ingen utomstående kan använda din
// AI-budget genom att posta direkt till den här adressen.
//
// Klienten skickar { system, text, image, mimeType } plus en
// Authorization: Bearer <access_token>-header — den här funktionen
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

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData?.user) {
    return res.status(401).json({ error: "Ogiltig eller utgången session. Logga in igen." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY saknas i miljövariablerna på servern." });
  }

  const { system, text, image, mimeType } = req.body || {};

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

    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({ text: outputText });
  } catch (err) {
    res.status(500).json({ error: "Kunde inte nå Gemini", details: err.message });
  }
}
