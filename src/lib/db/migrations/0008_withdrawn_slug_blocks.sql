CREATE TABLE "withdrawn_slug_blocks" (
	"slug_hash" varchar(64) PRIMARY KEY NOT NULL,
	"blocked_until" timestamp NOT NULL
);
