DROP INDEX "bank_accounts_user_id_idx";--> statement-breakpoint
DROP INDEX "wishlists_owner_id_idx";--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_owner_id_unique" UNIQUE("owner_id");