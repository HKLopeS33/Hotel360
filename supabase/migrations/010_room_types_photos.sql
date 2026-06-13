-- Tipo de quarto na solicitação de reserva online
ALTER TABLE online_reservations ADD COLUMN IF NOT EXISTS tipo_quarto TEXT;

-- Fotos por tipo de quarto, configuradas pelo hotel: { "single": ["url1", "url2"], "double": [...], ... }
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_quartos_fotos JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Bucket público para fotos dos tipos de quarto (exibidas no link de reserva online)
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-photos', 'room-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Arquivos organizados como {hotel_id}/{tipo_quarto}/{arquivo}
DROP POLICY IF EXISTS "room_photos_select" ON storage.objects;
CREATE POLICY "room_photos_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'room-photos');

DROP POLICY IF EXISTS "room_photos_insert" ON storage.objects;
CREATE POLICY "room_photos_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'room-photos' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));

DROP POLICY IF EXISTS "room_photos_update" ON storage.objects;
CREATE POLICY "room_photos_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'room-photos' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));

DROP POLICY IF EXISTS "room_photos_delete" ON storage.objects;
CREATE POLICY "room_photos_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'room-photos' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));
