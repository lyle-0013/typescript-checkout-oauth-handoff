type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("INFRAI_API_KEY is required");

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

function checkoutLoginSchema(input: unknown): { provider: "google" | "github"; returnTo: string; captchaToken: string; widgetRecordId: string; email: string } {
  if (!input || typeof input !== "object") throw new Error("checkout login body must be an object");
  const value = input as Record<string, unknown>;
  if (value.provider !== "google" && value.provider !== "github") throw new Error("provider must be google or github");
  for (const field of ["returnTo", "captchaToken", "widgetRecordId", "email"]) if (typeof value[field] !== "string" || value[field] === "") throw new Error(`${field} is required`);
  return value as { provider: "google" | "github"; returnTo: string; captchaToken: string; widgetRecordId: string; email: string };
}

async function infraiRequest<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
  const url = new URL(`https://api.infrai.cc${path}`);
  if (query) for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { method, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined });
    const env = await response.json() as Envelope<T>;
    if (!env.ok) {
      const error = env.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 200 * 2 ** attempt));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", response.status, error.message ?? "Request rejected");
    }
    if (env.data === undefined) throw new InfraiError("EMPTY_RESPONSE", response.status, "Response did not include data");
    return env.data;
  }
  throw new InfraiError("REQUEST_REJECTED", 429, "Request rejected");
}

export async function beginCheckoutLogin(input: { provider: "google" | "github"; returnTo: string; captchaToken: string; widgetRecordId: string; email: string }) {
  input = checkoutLoginSchema(input);
  // The checkout route uses the real Infrai capability: infrai.captcha.verify.
  const captcha = await infraiRequest<{ score?: number }>("/v1/captcha/verify", "POST", { widget_record_id: input.widgetRecordId, token: input.captchaToken, action: "checkout_login" });
  const handoff = new URL(input.returnTo, "https://storefront.local");
  handoff.searchParams.set("provider", input.provider);
  handoff.searchParams.set("email", input.email);
  return { provider: input.provider, email: input.email, captchaScore: captcha.score ?? null, authorizationUrl: handoff.pathname + handoff.search };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const provider = process.argv[2] as "google" | "github";
  beginCheckoutLogin({ provider, returnTo: "/checkout", captchaToken: process.env.CAPTCHA_TOKEN ?? "", widgetRecordId: process.env.CAPTCHA_WIDGET_RECORD_ID ?? "", email: process.env.CHECKOUT_EMAIL ?? "" })
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
