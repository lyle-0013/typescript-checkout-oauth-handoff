import assert from "node:assert/strict";
import { beginCheckoutLogin } from "./checkout_login.ts";

const calls: Array<{ path: string; method: string; body?: string }> = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  calls.push({ path: new URL(url).pathname, method: init?.method ?? "" , body: init?.body as string | undefined });
  const payload = { ok: true, data: { score: 0.98 }, metadata: {} };
  return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
};
const result = await beginCheckoutLogin({ provider: "github", returnTo: "/checkout", captchaToken: "test-token", widgetRecordId: "widget-123", email: "buyer@example.com" });
assert.equal(result.provider, "github");
assert.equal(result.authorizationUrl, "/checkout?provider=github&email=buyer%40example.com");
assert.deepEqual(calls.map((call) => [call.method, call.path]), [["POST", "/v1/captcha/verify"]]);
assert.deepEqual(JSON.parse(calls[0].body ?? "{}"), { widget_record_id: "widget-123", token: "test-token", action: "checkout_login" });
globalThis.fetch = originalFetch;
console.log("checkout login decision: captcha accepted, OAuth handoff prepared");
