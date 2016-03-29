CREATE TABLE "post"
  ("id"        SERIAL PRIMARY KEY NOT NULL,
   "type"      TEXT,
   "message"   TEXT,
   "user_id"   INT REFERENCES "user"("id") NOT NULL,
   "room_id"   INT REFERENCES "room"("id") NOT NULL,
   "created"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL);

CREATE INDEX "post_room_index"
  ON "post"("room_id");

CREATE INDEX "post_user_index"
  ON "post"("user_id");
