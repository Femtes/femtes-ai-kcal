# Flytta Femtes AI kcal till Supabase

Den här mappen innehåller allt du behöver för att gå från prototypen i Claude
till en riktig app med konton, databas och e-post. Filerna körs **inte** här
i Claude-artefakten (paketet `@supabase/supabase-js` finns inte i den miljön
och nätverksanrop till externa domäner blockeras) — de är skrivna för att
klistras in i ett riktigt projekt (t.ex. Vite eller Next.js).

## Innehåll

| Fil | Vad den gör |
|---|---|
| `schema.sql` | Alla databastabeller + säkerhetsregler (RLS), en tabell per datatyp appen redan har |
| `supabaseClient.js` | Kopplar upp appen mot ditt Supabase-projekt |
| `auth.js` | Registrering, inloggning, utloggning, glömt lösenord — med riktiga mejl |
| `dataAccess.js` | Exempel på hur `window.storage`-anropen ersätts med riktiga databasfrågor |

## Steg för steg

1. **Skapa ett Supabase-projekt** på [supabase.com](https://supabase.com) (gratisnivån räcker gott för att komma igång).
2. **Kör `schema.sql`** i Supabase SQL Editor (Dashboard → SQL Editor → klistra in → Run).
3. **Skapa ett riktigt frontend-projekt**, t.ex. med `npm create vite@latest` (React + JavaScript), och flytta över `portion-v4.jsx`-koden dit.
4. **Installera Supabase-klienten**: `npm install @supabase/supabase-js`
5. **Lägg till dina projektnycklar** i en `.env.local`-fil (hitta dem under Project Settings → API i Supabase):
   ```
   VITE_SUPABASE_URL=https://ditt-projekt.supabase.co
   VITE_SUPABASE_ANON_KEY=din-anon-nyckel
   ```
6. **Kopiera in `supabaseClient.js` och `auth.js`** i ditt projekt.
7. **Byt ut appens autentisering**: ersätt den lokala "låtsas-inloggningen" med `registerAccount`, `loginWithPassword`, `logout`, `requestPasswordReset` från `auth.js`.
8. **Byt ut datalagret gradvis**: gå igenom `portion-v4.jsx` och byt varje `window.storage.get/set` mot motsvarande funktion i `dataAccess.js` (eller skriv fler efter samma mönster för vatten, träning, vikt, fasta och livsmedelsbiblioteket).
9. **Aktivera e-post i Supabase**: under Authentication → Settings kan du slå på "Confirm email" för verifieringsmejl, och återställning av lösenord fungerar automatiskt via `requestPasswordReset`.
10. **Publicera** appen via t.ex. Vercel eller Netlify, koppla en domän — nu har du en riktig, flerspråkig app med säkra konton.

## Viktigt att tänka på vid migreringen

- **Bilder**: dagens app sparar foton som base64-text direkt i loggposten. Det blir för tungt i en riktig databas — ladda i stället upp till *Supabase Storage* (se `uploadMealImage` i `dataAccess.js`) och spara bara länken.
- **Delade måltider**: koderna (`portion-shared-meal:XXXXX`) fungerar likadant i Supabase, men lägg gärna till en `expires_at`-städning (redan förberedd i schemat) så gamla koder försvinner automatiskt.
- **Datum och tidszoner**: Supabase lagrar `timestamptz` i UTC — se till att formatera om till användarens lokala tid i gränssnittet, precis som appen redan gör med `dateKey()`-funktionerna.
- **Testa RLS ordentligt**: logga in som två olika testkonton och bekräfta att de aldrig kan se varandras data innan du lanserar.
