CREATE TYPE "relationship_type" AS ENUM ('friend', 'block');

CREATE TABLE "relationship"
  ("id"             SERIAL PRIMARY KEY NOT NULL,
   "type"           relationship_type NOT NULL,
   "user_id"        INT REFERENCES "user"("id") NOT NULL,
   "user2_id"       INT REFERENCES "user"("id") NOT NULL,
   "created"        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL);

CREATE INDEX "relationship_index"
  ON "relationship"("user_id", "type");

CREATE UNIQUE INDEX "relationship_unique_index"
  ON "resident"("type", "user_id", "user2_id");
