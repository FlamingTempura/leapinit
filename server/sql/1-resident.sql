CREATE TABLE "resident"
  ("id"            SERIAL PRIMARY KEY NOT NULL,
   "user_id"       INT REFERENCES "user"("id") NOT NULL,
   "room_id"       INT REFERENCES "room"("id") NOT NULL,
   "code_id"       INT REFERENCES "code"("id") NOT NULL,
   "is_admin"      BOOLEAN NOT NULL,
   "created"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL);

CREATE INDEX "resident_room_index"
  ON "resident"("room_id");

CREATE INDEX "resident_user_index"
  ON "resident"("user_id");

CREATE UNIQUE INDEX "resident_unique_index"
  ON "resident"("user_id", "room_id");
