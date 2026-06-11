-- Veículo e documento anexado no cadastro do hóspede
ALTER TABLE guests ADD COLUMN IF NOT EXISTS tem_veiculo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS placa_veiculo TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS documento_url TEXT;

-- Bucket privado para documentos dos hóspedes (RG, CNH, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-documents', 'guest-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Arquivos organizados como {hotel_id}/{guest_id}/{arquivo}
CREATE POLICY "guest_documents_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'guest-documents' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));

CREATE POLICY "guest_documents_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'guest-documents' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));

CREATE POLICY "guest_documents_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'guest-documents' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));

CREATE POLICY "guest_documents_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'guest-documents' AND (split_part(name, '/', 1) = auth_hotel_id()::text OR is_master()));
