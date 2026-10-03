-- AlterTable
ALTER TABLE "user" ADD COLUMN     "onboardedAt" TIMESTAMP(3);

-- Existing users already have an account: they skip onboarding.
UPDATE "user" SET "onboardedAt" = "createdAt";
