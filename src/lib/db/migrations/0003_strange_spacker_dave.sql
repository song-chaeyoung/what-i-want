ALTER TABLE "messages" ADD COLUMN "client_request_id" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX "messages_client_request_id_idx" ON "messages" USING btree ("client_request_id");