# Payments

Payment provider adapters live in `lib/payments`. Catalog, purchase, subscription, and webhook application logic live in `features/payments`.

## Checkout and webhook flow

1. An authenticated client sends a `productId` to `/api/payments/checkout`.
2. The server finds the product in `features/payments/catalog.ts`; client-supplied prices are not trusted.
3. The service creates a pending purchase, asks the provider for checkout, and stores the checkout reference.
4. Provider webhooks are verified by the adapter and normalized to `PaymentEvent`.
5. `applyPaymentEvent` records event IDs and updates purchases or subscriptions in a database transaction.

The event ID uniqueness constraint makes webhook retries idempotent. Validate the provider, purchase reference, amount, and currency before granting access. A successful payment should be connected to the application's own entitlement flow; payment status alone does not grant product access in this starter.

## Providers and catalog

- EPay uses MZN and supports scheduled reconciliation for pending checkouts.
- Dodo Payments uses USD and supports subscriptions and cancellation.
- Product IDs, provider, currency, and amount are configured with `PAYMENT_CATALOG` JSON. Amounts are in minor currency units.
- Provider webhook endpoints are `/api/payments/epay/webhook` and `/api/payments/dodo/webhook`.

Do not put secret keys in the catalog or client bundle. Verify webhook signatures before applying events. Configure the provider credentials and callback URLs in the environment and provider dashboard.
