CREATE TYPE reaction_type AS ENUM ('love', 'hate');

CREATE TABLE "reaction"
  ("id"        SERIAL PRIMARY KEY NOT NULL,
   "user_id"   INT REFERENCES "user"("id") NOT NULL,
   "post_id"   INT REFERENCES "post"("id") NOT NULL,
   "type"      reaction_type NOT NULL,
   "created"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL);

CREATE INDEX "reaction_post_index"
  ON "reaction"("post_id");

CREATE UNIQUE INDEX "reaction_unique"
  ON "reaction"("user_id", "post_id");
