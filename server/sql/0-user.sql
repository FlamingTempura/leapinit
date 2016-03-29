CREATE TABLE "user"
  ("id"                  SERIAL PRIMARY KEY NOT NULL,
   "username"            TEXT,
   "password_hash"       TEXT,
   "created"             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
   "banned"              BOOLEAN DEFAULT FALSE NOT NULL);

CREATE INDEX "user_auth_index"
  ON "user"("email_hash", "password_hash");
