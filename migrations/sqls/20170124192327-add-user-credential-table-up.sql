CREATE TABLE IF NOT EXISTS "userCredentials" (
  "userCredentialId" SERIAL NOT NULL,
  "accountId" INTEGER NOT NULL,
  "password" CHARACTER VARYING(512) NOT NULL,
  "createdDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX "IDX_USER_CREDENTIAL_ID" ON "userCredentials"
  ("userCredentialId" ASC);
ALTER TABLE "userCredentials" ADD CONSTRAINT "PK_USER_CREDENTIAL_ID" PRIMARY KEY
  ("userCredentialId");
CREATE INDEX "IDX_USER_CREDENTIAL_ACCOUNT_ID" ON "userCredentials"
  ("accountId" ASC);
