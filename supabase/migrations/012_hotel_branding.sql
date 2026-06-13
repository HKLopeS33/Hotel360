-- Personalização da página pública de reserva online
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_logo_url TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_imagem_capa_url TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_cor_primaria TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_descricao TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_template TEXT NOT NULL DEFAULT 'classico';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_fotos_galeria JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Bucket público para logo, capa e galeria de fotos do hotel (exibidos no link de reserva online)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-branding', 'hotel-branding', true)
ON CONFLICT (id) DO NOTHING;

-- Arquivos organizados como {hotel_id}/{logo|capa|galeria}/{arquivo}
DROP POLICY IF EXISTS "hotel_branding_select" ON storage.objects;
CREATE POLICY "hotel_branding_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'hotel-branding');

DROP POLICY IF EXISTS "hotel_branding_insert" ON storage.objects;
CREATE POLICY "hotel_branding_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hotel-branding' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));

DROP POLICY IF EXISTS "hotel_branding_update" ON storage.objects;
CREATE POLICY "hotel_branding_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'hotel-branding' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));

DROP POLICY IF EXISTS "hotel_branding_delete" ON storage.objects;
CREATE POLICY "hotel_branding_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'hotel-branding' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));
