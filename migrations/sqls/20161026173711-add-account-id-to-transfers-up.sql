ALTER TABLE transfers ADD COLUMN "creditAccountId" INTEGER REFERENCES "accounts" ("accountId");
ALTER TABLE transfers ADD COLUMN "debitAccountId" INTEGER REFERENCES "accounts" ("accountId");

CREATE INDEX "IDX_TRANS_CRED_ACCT_ID" ON transfers
  ("creditAccountId" ASC);
CREATE INDEX "IDX_TRANS_DEB_ACCT_ID" ON transfers
  ("debitAccountId" ASC);

ALTER TABLE transfers DROP COLUMN "creditAccount";
ALTER TABLE transfers DROP COLUMN "debitAccount";
