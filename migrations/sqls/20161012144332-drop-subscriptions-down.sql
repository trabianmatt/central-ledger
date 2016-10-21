CREATE TABLE IF NOT EXISTS subscriptions (
  "subscriptionId" SERIAL NOT NULL,
  "subscriptionUuid" CHARACTER VARYING(36) NOT NULL,
  "url" CHARACTER VARYING(512) NOT NULL,
  "secret" CHARACTER VARYING(128) NOT NULL,
  "deleted" SMALLINT DEFAULT 0 NOT NULL,
  "createdDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX "IDX_SUBSCRIPTION_ID" ON subscriptions
  ("subscriptionId" ASC);
ALTER TABLE subscriptions ADD CONSTRAINT "PK_SUBSCRIPTION_ID" PRIMARY KEY
  ("subscriptionId");
CREATE INDEX "IDX_SUBSCRIPTION_UUID" ON subscriptions
  ("subscriptionUuid" ASC);
ALTER TABLE subscriptions ADD CONSTRAINT "UK_SUBSCRIPTION_UUID" UNIQUE
  ("subscriptionUuid");