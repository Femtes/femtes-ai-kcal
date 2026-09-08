-- ============================================================
-- food-images — Storage-bucket för foton på mat.
-- Kör detta i Supabase SQL Editor. Skapar en bucket där varje
-- användares bilder ligger i en egen mapp (deras user-id), så
-- själva databastabellerna bara behöver spara en länk (URL)
-- istället för hela bilden — håller sökningar snabba även när
-- biblioteket växer sig stort.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', true)
on conflict (id) do nothing;

-- Endast inloggade användare kan ladda upp, och bara till sin egen mapp
create policy "Users upload their own food images"
  on storage.objects for insert
  with check (
    bucket_id = 'food-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Alla (inklusive den som fått en delad måltid) kan läsa bilder,
-- eftersom bucketen är public — enklast för att bilder ska visas
-- direkt utan extra inloggningskrångel.
create policy "Anyone can view food images"
  on storage.objects for select
  using (bucket_id = 'food-images');

-- Användare kan bara ta bort sina egna bilder
create policy "Users delete their own food images"
  on storage.objects for delete
  using (
    bucket_id = 'food-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
