ALTER TABLE "profiles" ADD COLUMN "onboarding_guide_completed_at" timestamp;

UPDATE "profiles"
SET "onboarding_guide_completed_at" = "onboarding_completed_at"
WHERE "onboarding_completed_at" IS NOT NULL;
