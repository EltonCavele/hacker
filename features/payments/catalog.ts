import "server-only";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  provider: z.enum(["EPAY", "DODO"]),
  currency: z.enum(["MZN", "USD"]),
  amountMinor: z.number().int().positive(),
  providerProductId: z.string().optional(),
}).refine((product) => (product.provider === "EPAY" && product.currency === "MZN") || (product.provider === "DODO" && product.currency === "USD"), {
  message: "EPay products must use MZN and Dodo products must use USD",
});

export type PaymentProduct = z.infer<typeof productSchema>;

const catalogSchema = z.array(productSchema).refine(
  (products) => new Set(products.map(({ id }) => id)).size === products.length,
  "Payment product IDs must be unique",
);

export const paymentCatalog = catalogSchema.parse(
  JSON.parse(process.env.PAYMENT_CATALOG ?? "[]") as unknown,
);
