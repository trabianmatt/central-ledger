ALTER TABLE accounts DROP CONSTRAINT "UK_KEY";
ALTER TABLE accounts DROP COLUMN "key";
ALTER TABLE accounts DROP COLUMN "secret";