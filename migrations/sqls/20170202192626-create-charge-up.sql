CREATE TABLE IF NOT EXISTS charges (
  "chargeId" SERIAL NOT NULL,
  "chargeType" CHARACTER VARYING(256) NOT NULL,
  "name" CHARACTER VARYING(256) NOT NULL,
  "rate" DECIMAL(10,2) DEFAULT 0 NOT NULL,
  "rateType" CHARACTER VARYING(256) NOT NULL,
  "minimum" DECIMAL(10,2) NULL,
  "maximum" DECIMAL(10,2) NULL,
  "code" CHARACTER VARYING(256) NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX "IDX_CHARGE_ID" ON charges
  ("chargeId" ASC);
ALTER TABLE charges ADD CONSTRAINT "PK_CHARGE_ID" PRIMARY KEY
  ("chargeId");
CREATE INDEX "IDX_CHARGE_NAME" ON charges
  ("name" ASC);
ALTER TABLE charges ADD CONSTRAINT "UK_CHARGE_NAME" UNIQUE
  ("name");