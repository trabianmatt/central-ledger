CREATE TABLE IF NOT EXISTS roles (
  "roleId" UUID NOT NULL,
  "name" CHARACTER VARYING(256) NOT NULL,
  "description" CHARACTER VARYING(1000) NULL,
  "permissions" TEXT NOT NULL,
  "createdDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX "IDX_ROLE_ID" ON roles
  ("roleId" ASC);
ALTER TABLE roles ADD CONSTRAINT "PK_ROLE_ID" PRIMARY KEY
  ("roleId");
CREATE INDEX "IDX_ROLE_NAME" ON roles
  ("name" ASC);
ALTER TABLE roles ADD CONSTRAINT "UK_ROLE_NAME" UNIQUE
  ("name");