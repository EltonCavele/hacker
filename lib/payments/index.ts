import "server-only";

import { DodoPaymentProvider } from "./providers/dodo";
import { EpayPaymentProvider } from "./providers/epay";
import type { PaymentProvider, PaymentProviderName } from "./types";

const providers: Record<PaymentProviderName, PaymentProvider> = {
  EPAY: new EpayPaymentProvider(),
  DODO: new DodoPaymentProvider(),
};

export function getPaymentProvider(name: PaymentProviderName) {
  return providers[name];
}

export type { PaymentCurrency, PaymentEvent, PaymentProviderName } from "./types";
