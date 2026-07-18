/**
 * Minimal Flutterwave REST client (server-only — only imported from route
 * handlers; uses secret env keys that must never reach the browser). We call two endpoints:
 *   - POST /payments        — initialize a transaction, get a hosted pay link
 *   - GET  /transactions/:id/verify — confirm a transaction after callback/webhook
 *
 * Keys come from the environment and are never exposed to the browser:
 *   FLW_SECRET_KEY    — server secret (sk_test_... in sandbox)
 *   FLW_SECRET_HASH   — the webhook "secret hash" you set in the FLW dashboard
 * The public key isn't needed for the redirect flow.
 *
 * Sandbox/test mode is automatic: use your TEST secret key and everything runs
 * against Flutterwave's test environment.
 */

const BASE = "https://api.flutterwave.com/v3";

export function flutterwaveConfigured(): boolean {
  return Boolean(process.env.FLW_SECRET_KEY);
}

function secretKey(): string {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new Error("FLW_SECRET_KEY is not set");
  return key;
}

export interface InitPaymentInput {
  txRef: string;
  amount: number; // in the charge currency (NGN)
  currency: string;
  redirectUrl: string;
  customer: { email: string; name?: string; phonenumber?: string };
  meta?: Record<string, string>;
}

export interface InitPaymentResult {
  paymentLink: string;
}

/** Initialize a transaction; returns the hosted checkout URL to redirect to. */
export async function initPayment(input: InitPaymentInput): Promise<InitPaymentResult> {
  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amount,
      currency: input.currency,
      redirect_url: input.redirectUrl,
      customer: input.customer,
      meta: input.meta,
      customizations: { title: "Marketforyou" },
    }),
  });

  const json = await res.json();
  if (!res.ok || json.status !== "success" || !json.data?.link) {
    throw new Error(json?.message || "Failed to initialize payment");
  }
  return { paymentLink: json.data.link as string };
}

export interface VerifiedTransaction {
  status: string; // "successful" | ...
  txRef: string;
  amount: number;
  currency: string;
  id: number;
}

/** Verify a transaction by its Flutterwave id (from the callback/webhook). */
export async function verifyTransaction(transactionId: string | number): Promise<VerifiedTransaction> {
  const res = await fetch(`${BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success" || !json.data) {
    throw new Error(json?.message || "Failed to verify transaction");
  }
  return {
    status: json.data.status,
    txRef: json.data.tx_ref,
    amount: json.data.amount,
    currency: json.data.currency,
    id: json.data.id,
  };
}
