CREATE TABLE IF NOT EXISTS "userRoles" (
  "userId" UUID REFERENCES users ("userId"),
  "roleId" UUID REFERENCES roles ("roleId"),
  CONSTRAINT "userRoles_pkey" PRIMARY KEY ("userId", "roleId")
)
