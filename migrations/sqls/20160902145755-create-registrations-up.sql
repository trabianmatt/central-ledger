CREATE TABLE IF NOT EXISTS registrations (
  "registrationId" SERIAL NOT NULL,
  "registrationUuid" UUID NOT NULL,
  "identifier" CHARACTER VARYING(512) NOT NULL,
  "name" CHARACTER VARYING(256) NOT NULL,
  "createdDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX "IDX_REGISTRATION_ID" ON registrations
  ("registrationId" ASC);
ALTER TABLE registrations ADD CONSTRAINT "PK_REGISTRATION_ID" PRIMARY KEY
  ("registrationId");
CREATE INDEX "IDX_REGISTRATION_UUID" ON registrations
  ("registrationUuid" ASC);
ALTER TABLE registrations ADD CONSTRAINT "UK_REGISTRATION_UUID" UNIQUE
  ("registrationUuid");
CREATE INDEX "IDX_IDENTIFIER" ON registrations
  ("identifier" ASC);
ALTER TABLE registrations ADD CONSTRAINT "UK_IDENTIFIER" UNIQUE
  ("identifier");