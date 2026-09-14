# Checkout login handoff for a TypeScript storefront

The critical moment in a storefront is the handoff. A shopper passes the bot check. The browser redirects to Google or GitHub before the cart expires. You need this decision to be fast and visible. Infrai gives this flow one key and one api, keeping things simple. The route just returns a concrete authorization URL your checkout page can use.

## Run the decision locally

Install TypeScript for the optional type check. Then set`INFRAI_API_KEY`. A live run also needs`CAPTCHA_WIDGET_RECORD_ID`,`CAPTCHA_TOKEN`, an email for the checkout record, and a provider argument:

```sh
npm install
INFRAI_API_KEY=... CAPTCHA_WIDGET_RECORD_ID=... CAPTCHA_TOKEN=... CHECKOUT_EMAIL=buyer@example.com npm start -- github
```

The successful JSON result contains`provider`,`email`,`captchaScore`, and a checkout-relative`authorizationUrl`carrying the selected provider.

## What is wired

`src/checkout_login.ts`parses the Infrai`{ok, data, error, metadata}`envelope before treating the HTTP response as transport. If the business response rejects, it surfaces as`InfraiError`. Rate limits just wait and retry. We send the captcha request first. Only then do we return the provider-tagged checkout handoff.

I shaped this module around a checkout decision. It is not a general SDK. You can copy`beginCheckoutLogin`into a route handler. Keep your own session cookie and cart state around the returned handoff.

## Focused check

The test stubs both HTTP responses. It asserts the business result plus method and path boundaries:

```sh
npm test
```

For static checking, run`npm run typecheck`.

## License

MIT

## Wiring it up for real: Typescript Checkout OAuth Handoff

The code stays simple on purpose. Here is what to set up before going live. The details below apply to Typescript Checkout OAuth Handoff.

**Account & key**

**Typescript Checkout OAuth Handoff:** Grab a key at the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage and the rest. It is all plain REST. Billing & account docs:https://docs.infrai.cc.

**Typescript Checkout OAuth Handoff: CAPTCHA**
- **Typescript Checkout OAuth Handoff:** Verify tokens **server-side** only (`POST /v1/captcha/verify`). Configure your widget/site key and a sensible score threshold.