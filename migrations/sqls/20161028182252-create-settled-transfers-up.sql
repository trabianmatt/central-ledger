CREATE TABLE IF NOT EXISTS "settledTransfers" (
  "transferId" UUID PRIMARY KEY NOT NULL,
  "settlementId" UUID NOT NULL
);