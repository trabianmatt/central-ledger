CREATE TABLE IF NOT EXISTS "ledgerDomainEvents" (
  "eventId" UUID PRIMARY KEY NOT NULL,
  "name" CHARACTER VARYING(128) NOT NULL,
  "payload" JSONB NOT NULL,
  "aggregateId" UUID NOT NULL,
  "aggregateName" CHARACTER VARYING(128) NOT NULL,
  "sequenceNumber" SMALLINT NOT NULL,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "ledgerDomainEvents_aggregateId_sequenceNumber_key" UNIQUE ("aggregateId", "sequenceNumber")
);