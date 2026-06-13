-- Permite que administradores do próprio hotel atualizem os dados do hotel
-- (configurações de reserva online, personalização, etc). Antes só "master"
-- tinha permissão de UPDATE em hotels, então essas alterações eram
-- silenciosamente ignoradas pelo RLS para usuários "admin".
CREATE OR REPLACE FUNCTION is_hotel_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "hotels_admin_update" ON hotels;
CREATE POLICY "hotels_admin_update" ON hotels FOR UPDATE
  USING (id = auth_hotel_id() AND is_hotel_admin())
  WITH CHECK (id = auth_hotel_id() AND is_hotel_admin());
