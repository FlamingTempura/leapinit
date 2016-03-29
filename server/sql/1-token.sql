CREATE TABLE "token"
  ("id"        SERIAL PRIMARY KEY NOT NULL,
   "uuid_hash" BYTEA NOT NULL UNIQUE,
   "user_id"   INT REFERENCES "user"("id") NOT NULL,
   "last_used" TIMESTAMP WITH time zone NOT NULL); -- used so we can clear the table occasionally

CREATE INDEX "token_uuid_index"
  ON "token"("uuid_hash");
