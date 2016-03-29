CREATE TABLE "user"
  ("id"                  SERIAL PRIMARY KEY NOT NULL,
   "email_ciphertext"    BYTEA NOT NULL,
   "email_hash"          BYTEA NOT NULL UNIQUE, -- used to ensure emails are unique, and for faster auth
   "password_hash"       TEXT NOT NULL,
   "created"             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
   "banned"              BOOLEAN DEFAULT FALSE NOT NULL);

CREATE INDEX "user_auth_index"
  ON "user"("email_hash", "password_hash");
