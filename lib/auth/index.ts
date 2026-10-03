import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins/email-otp";
import { passkey } from "@better-auth/passkey";
import { createElement } from "react";
import { OtpEmail, otpEmailSubject } from "../../emails/otp-email";
import { getRequestLocale } from "../i18n/server";
import { sendEmail } from "../email";
import { renderEmail } from "../email/render";
import { prisma } from "../db/client";
import { getEnv } from "../env";
import { logger } from "../logger";
import { getStorageProvider } from "../storage";
import { betterAuthRateLimitStorage } from "../rate-limit";

const env = getEnv();

const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
};

const OTP_EXPIRES_IN_SECONDS = 300;

const appUrl = env.BETTER_AUTH_URL ? new URL(env.BETTER_AUTH_URL) : null;

export const auth = betterAuth({
  appName: "Nextpad",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders,
  user: {
    // Self-service account deletion (Settings → Delete account). Requires a session created within `freshAge`
    // (1 day by default); older sessions get SESSION_EXPIRED and must sign in again first.
    deleteUser: {
      enabled: true,
      async beforeDelete(user) {
        // Deleting the user cascades to payment rows, but would not stop the provider from billing again.
        const active = await prisma.paymentSubscription.count({
          where: { userId: user.id, status: { in: ["ACTIVE", "PAST_DUE", "ON_HOLD"] }, cancelAtPeriodEnd: false },
        });
        if (active > 0) {
          throw APIError.from("BAD_REQUEST", {
            code: "ACTIVE_SUBSCRIPTION",
            message: "Cancel your active subscriptions before deleting your account",
          });
        }
      },
      async afterDelete(user) {
        // The database rows are gone; remove the user's files too. Best effort: failures are logged, not surfaced.
        if (!env.STORAGE_BUCKET) return;
        const storage = getStorageProvider();
        const prefix = `users/${encodeURIComponent(user.id)}/`;
        await Promise.all([storage.deletePrefix(prefix), storage.deletePrefix(`pending/${prefix}`)]).catch((error) =>
          logger.error({ err: error, userId: user.id }, "Could not delete the files of a deleted account"),
        );
        logger.info({ userId: user.id }, "Account deleted");
      },
    },
    additionalFields: {
      // Set once the user answered the "create a passkey" prompt shown after their first login.
      passkeyPromptedAt: { type: "date", required: false, input: false },
      // Set when the user finishes onboarding right after creating their account.
      onboardedAt: { type: "date", required: false, input: false },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: OTP_EXPIRES_IN_SECONDS,
      storeOTP: "hashed",
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "sign-in") return;
        // Read before the fire-and-forget below: the request scope is gone once the response is sent.
        const locale = await getRequestLocale();
        // Not awaited on purpose: avoids leaking whether the user exists through response timing.
        void renderEmail(createElement(OtpEmail, { code: otp, expiresInMinutes: OTP_EXPIRES_IN_SECONDS / 60, locale }))
          .then((content) => sendEmail({ to: email, subject: otpEmailSubject(otp, locale), ...content }))
          .catch((error) => logger.error({ err: error }, "Falha ao enviar o OTP por e-mail"));
      },
    }),
    passkey({
      rpID: appUrl?.hostname ?? "localhost",
      rpName: "Nextpad",
      origin: appUrl?.origin,
    }),
  ],
  trustedOrigins: [
    ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : []),
    // Dev only: a phone on the same Wi-Fi opens the app at http://192.168.x.x:3000 (see allowedDevOrigins in next.config.ts).
    ...(process.env.NODE_ENV === "development" ? ["http://192.168.*.*:3000", "http://10.*.*.*:3000"] : []),
  ],
  // Active in production only (Better Auth default). Counters live in Redis so every replica shares them.
  rateLimit: {
    customStorage: betterAuthRateLimitStorage,
    customRules: {
      // Each OTP request sends an email: cap it hard to stop email bombing and code guessing.
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 10 },
      "/delete-user": { window: 300, max: 3 },
    },
  },
});
