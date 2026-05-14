ALTER TABLE "wish_items" ADD COLUMN "product_url" text;--> statement-breakpoint
ALTER TABLE "wish_items" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "wish_items" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;