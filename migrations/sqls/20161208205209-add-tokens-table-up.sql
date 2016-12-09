CREATE TABLE IF NOT EXISTS tokens
(
  "tokenId" SERIAL NOT NULL,
  "accountId" integer NOT NULL,
  "token" character varying(1000) NOT NULL,
  "createdDate" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "PK_TOKEN_ID" PRIMARY KEY ("tokenId"),
  CONSTRAINT "FK_TOKENS_ACCOUNTS" FOREIGN KEY ("accountId")
      REFERENCES accounts ("accountId") MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "UK_TOKEN" UNIQUE (token)
);

CREATE INDEX "IDX_TOKENS_ACCOUNT_ID" ON tokens
  ("accountId");
