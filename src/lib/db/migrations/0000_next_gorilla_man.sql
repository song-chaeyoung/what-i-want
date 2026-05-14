CREATE TYPE "public"."account_visibility" AS ENUM('always_visible', 'reveal_on_click', 'copy_only', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."public_theme" AS ENUM('pixel_y2k', 'mono_bw', 'soft_pastel');--> statement-breakpoint
CREATE TYPE "public"."wish_status" AS ENUM('open', 'fulfilled', 'hidden', 'paused');--> statement-breakpoint
CREATE TYPE "public"."wishlist_visibility" AS ENUM('public');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "authenticators" (
	"credential_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_account_id" text NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" text NOT NULL,
	"credential_backed_up" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
	CONSTRAINT "authenticators_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bank_name" varchar(80) NOT NULL,
	"account_holder" varchar(80) NOT NULL,
	"account_number_encrypted" text NOT NULL,
	"visibility" "account_visibility" DEFAULT 'hidden' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funding_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wish_item_id" uuid NOT NULL,
	"message_id" uuid,
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wishlist_id" uuid NOT NULL,
	"wish_item_id" uuid,
	"sender_name" varchar(80),
	"body" text NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"birthday" date,
	"description" text,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "wish_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wishlist_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text,
	"target_amount" integer,
	"funded_amount" integer DEFAULT 0 NOT NULL,
	"status" "wish_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"slug" varchar(32) NOT NULL,
	"title" varchar(120) NOT NULL,
	"theme_id" "public_theme" DEFAULT 'pixel_y2k' NOT NULL,
	"visibility" "wishlist_visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_logs" ADD CONSTRAINT "funding_logs_wish_item_id_wish_items_id_fk" FOREIGN KEY ("wish_item_id") REFERENCES "public"."wish_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_logs" ADD CONSTRAINT "funding_logs_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_wish_item_id_wish_items_id_fk" FOREIGN KEY ("wish_item_id") REFERENCES "public"."wish_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wish_items" ADD CONSTRAINT "wish_items_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bank_accounts_user_id_idx" ON "bank_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "funding_logs_wish_item_id_idx" ON "funding_logs" USING btree ("wish_item_id");--> statement-breakpoint
CREATE INDEX "messages_wishlist_id_idx" ON "messages" USING btree ("wishlist_id");--> statement-breakpoint
CREATE INDEX "wish_items_wishlist_id_idx" ON "wish_items" USING btree ("wishlist_id");--> statement-breakpoint
CREATE INDEX "wishlists_owner_id_idx" ON "wishlists" USING btree ("owner_id");