# Femtes AI kcal

## Projektstruktur

```
femtes-app/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── main.jsx              ← startpunkt, laddar storage-polyfillen
│   ├── App.jsx                ← inloggning/registrering + visar Portion när inloggad
│   ├── Portion.jsx             ← din befintliga app, oförändrad
│   ├── index.css               ← Tailwind
│   └── lib/
│       ├── supabaseClient.js   ← kopplingen till ditt Supabase-projekt
│       ├── auth.js             ← registrera/logga in/ut/glömt lösenord
│       └── storagePolyfill.js  ← gör window.storage till localStorage tills vidare
```

## Kör lokalt

```bash
npm install
cp .env.example .env.local   # fyll i dina Supabase-nycklar
npm run dev
```

Öppna `http://localhost:5173`.

## Sätt upp Supabase

1. Skapa ett projekt på [supabase.com](https://supabase.com).
2. Kör SQL:en i `supabase-migration/schema.sql` (Dashboard → SQL Editor) om du redan har den — annars räcker det med Auth för att komma igång, tabellerna behövs först när du migrerar bort från localStorage.
3. Under **Authentication → Settings**, slå på "Confirm email" om du vill ha verifieringsmejl.
4. Hämta din URL och anon-nyckel under **Project Settings → API** och lägg i `.env.local`.

## Publicera på Vercel

1. Lägg upp projektet på GitHub (`git init`, `git add .`, `git commit`, `git push`).
2. Gå till [vercel.com](https://vercel.com) → **Add New Project** → välj ditt GitHub-repo.
3. Vercel känner av Vite automatiskt (Build Command: `npm run build`, Output Directory: `dist`).
4. Under **Environment Variables**, lägg till:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Klicka **Deploy**.
6. Gå tillbaka till Supabase → **Authentication → URL Configuration** och lägg till din Vercel-adress (t.ex. `https://ditt-projekt.vercel.app`) under "Redirect URLs", annars fungerar inte mejllänkarna för verifiering/återställning.

## Nästa steg

Appen sparar fortfarande data i webbläsarens `localStorage` (via `storagePolyfill.js`), bara kontona är riktiga just nu. Följ `supabase-migration/README.md` för att successivt flytta måltider, vikt, träning m.m. till riktiga Supabase-tabeller — då fungerar allt även om användaren byter enhet.
# femtes-ai-kcal
