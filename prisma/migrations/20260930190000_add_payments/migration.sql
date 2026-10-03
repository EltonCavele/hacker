CREATE TYPE "PaymentProvider" AS ENUM ('EPAY', 'DODO');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'ON_HOLD', 'EXPIRED');

CREATE TABLE "payment_purchases" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" VARCHAR(3) NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "provider_checkout_id" TEXT,
    "provider_payment_id" TEXT,
    "provider_subscription_id" TEXT,
    "checkout_url" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "payment_purchases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_provider_events" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "payment_provider_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_subscription_id" TEXT NOT NULL,
    "provider_customer_id" TEXT,
    "status" "PaymentSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" VARCHAR(3) NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "payment_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_purchases_provider_checkout_id_key" ON "payment_purchases"("provider_checkout_id");
CREATE UNIQUE INDEX "payment_purchases_provider_payment_id_key" ON "payment_purchases"("provider_payment_id");
CREATE INDEX "payment_purchases_user_id_created_at_idx" ON "payment_purchases"("user_id", "created_at");
CREATE INDEX "payment_purchases_provider_status_created_at_idx" ON "payment_purchases"("provider", "status", "created_at");
CREATE UNIQUE INDEX "payment_provider_events_event_id_key" ON "payment_provider_events"("event_id");
CREATE UNIQUE INDEX "payment_subscriptions_provider_subscription_id_key" ON "payment_subscriptions"("provider_subscription_id");
CREATE INDEX "payment_subscriptions_user_id_status_idx" ON "payment_subscriptions"("user_id", "status");
ALTER TABLE "payment_purchases" ADD CONSTRAINT "payment_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_subscriptions" ADD CONSTRAINT "payment_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
