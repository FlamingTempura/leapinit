CREATE TABLE "registration_token"
  ("id"        SERIAL PRIMARY KEY NOT NULL,
   "token"     TEXT NOT NULL UNIQUE,
   "user_id"   INT REFERENCES "user"("id") NOT NULL);

CREATE INDEX "registration_token_user_index"
  ON "registration_token"("user_id");
