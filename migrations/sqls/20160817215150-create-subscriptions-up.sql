CREATE TABLE IF NOT EXISTS subscriptions (
  "subscription_id" SERIAL NOT NULL,
  "subscription_uuid" CHARACTER VARYING(36) NOT NULL,
  "url" CHARACTER VARYING(512) NOT NULL,
  "secret" CHARACTER VARYING(128) NOT NULL,
  "deleted" SMALLINT DEFAULT 0 NOT NULL,
  "created_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX "IDX_SUBSCRIPTION_ID" ON subscriptions
  ("subscription_id" ASC);
ALTER TABLE subscriptions ADD CONSTRAINT "PK_SUBSCRIPTION_ID" PRIMARY KEY
  ("subscription_id");
CREATE INDEX "IDX_SUBSCRIPTION_UUID" ON subscriptions
  ("subscription_uuid" ASC);
ALTER TABLE subscriptions ADD CONSTRAINT "UK_SUBSCRIPTION_UUID" UNIQUE
  ("subscription_uuid");