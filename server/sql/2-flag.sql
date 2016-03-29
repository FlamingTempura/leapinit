CREATE TYPE flag_reason AS ENUM ('offensive', 'off-topic');

CREATE TABLE "flag"
  ("id"        SERIAL PRIMARY KEY NOT NULL,
   "user_id"   INT REFERENCES "user"("id") NOT NULL,
   "post_id"   INT REFERENCES "post"("id") NOT NULL,
   "reason"    flag_reason NOT NULL,
   "created"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL);

CREATE INDEX "flat_post_index"
  ON "flag"("post_id");
