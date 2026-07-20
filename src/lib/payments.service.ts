/**
 * Payment service abstraction — future online payment integration.
 * No gateway is wired yet. Consumers should depend on this interface only.
 */
export type PaymentInitInput = {
  student_fee_id: string;
  amount: number;
  currency?: "INR";
  description?: string;
  metadata?: Record<string, string>;
};

export type PaymentInitResult = {
  provider: "razorpay" | "phonepe" | "stripe" | "none";
  status: "not_configured" | "pending" | "success" | "failed";
  reference?: string;
  redirect_url?: string;
  message?: string;
};

export interface PaymentProvider {
  id: string;
  initiate(input: PaymentInitInput): Promise<PaymentInitResult>;
  verify(reference: string): Promise<PaymentInitResult>;
}

/** Default no-op provider until a real gateway is enabled. */
export const noopProvider: PaymentProvider = {
  id: "none",
  async initiate() {
    return { provider: "none", status: "not_configured", message: "Online payments are not enabled yet." };
  },
  async verify() {
    return { provider: "none", status: "not_configured", message: "Online payments are not enabled yet." };
  },
};

export function getPaymentProvider(): PaymentProvider {
  // Swap this out with a real provider (Razorpay, PhonePe, Stripe) later.
  return noopProvider;
}