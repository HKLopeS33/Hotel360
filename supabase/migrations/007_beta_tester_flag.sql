-- Feature flag por hotel: libera novidades em teste apenas para hotéis marcados
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS beta_tester BOOLEAN NOT NULL DEFAULT false;

UPDATE hotels SET beta_tester = true WHERE id = '9144632b-1560-4730-b236-8cb3ef40433b';
