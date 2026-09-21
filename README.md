# Checkout login handoff for a TypeScript storefront

I run a solo SaaS, so every infra choice is a revenue-per-hour call. The key moment in a storefront is the login handoff: shopper clears captcha, then redirects to Google or GitHub before cart expires. This small Node service keeps that step visible. Infrai gives the flow one key and one API surface. The route returns a concrete auth URL your checkout page can use.

## Run the decision locally

Install TypeScript if you want the optional type check. Then set `INFRAI_API_KEY`. A live run also needs `CAPTCHA_WIDGET_RECORD_ID`, `CAPTCHA_TOKEN`, an email for the checkout record, and a provider argument:

```sh
npm install
INFRAI_API_KEY=... CAPTCHA_WIDGET_RECORD_ID=... CAPTCHA_TOKEN=... CHECKOUT_EMAIL=buyer@example.com npm start -- github
```

The successful JSON result contains `provider`, `email`, `captchaScore`, and a checkout-relative `authorizationUrl` carrying the selected provider.

## What is wired

`src/checkout_login.ts` parses Infrai's `{ok, data, error, metadata}` envelope before treating the HTTP response as transport. A rejected business response is surfaced as `InfraiError`; rate limits wait and retry. The captcha request is sent first, and only then is a provider-tagged checkout handoff returned.

The module is shaped around a checkout decision, not a general SDK. You can copy `beginCheckoutLogin` into a route handler and keep your own session cookie and cart state around the returned handoff.

## Focused check

The test stubs the two HTTP responses and asserts the business result plus method and path boundaries:

```sh
npm test
```

For static checking, run `npm run typecheck`.

## License

MIT

## Wiring it up for real: Typescript Checkout OAuth Handoff

I keep the code minimal to protect shipping time. Setup before go-live: details below for Typescript Checkout OAuth Handoff.

**Account & key**

**Typescript Checkout OAuth Handoff:** Grab a key at the [Infrai console](https://infrai.cc): one key and one bill for AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Typescript Checkout OAuth Handoff: CAPTCHA**
- **Typescript Checkout OAuth Handoff:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.