CREATE TABLE "code"
  ("id"        SERIAL PRIMARY KEY NOT NULL,
   "code"      TEXT NOT NULL UNIQUE,
   "room_id"   INT REFERENCES "room"("id") NOT NULL,
   "created"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL);

CREATE INDEX "code_index"
  ON "user"("code");
