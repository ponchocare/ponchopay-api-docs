# PonchoPay API docs: plan and progress

Moving the PonchoPay API documentation from Notion to a Starlight (Astro) site on GitHub Pages,
then adding SDK walkthroughs and tooling that lets AI agents integrate PonchoPay.

**Status:** Phases 1 to 4 done and reviewed for parity with the Notion export: every Notion page
is ported, plus SDK walkthroughs (38 pages). On PR ponchocare/ponchopay-api-docs#1. Next: Phase 5,
agent and LLM tooling.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Site generator | Astro Starlight | Markdown, no Vue, pnpm/TypeScript like the main app, built-in search (Pagefind), `llms.txt` plugin available |
| Hosting | GitHub Pages via `withastro/action` (`.github/workflows/deploy.yml`) | Free, static, simple |
| URL | `https://ponchocare.github.io/ponchopay-api-docs/` for now (`base` set in `astro.config.mjs`) | Custom domain to decide (see open questions). Set `SITE_URL` and `BASE_PATH` in the workflow when it changes |
| Links in content | Root-relative (`/objects/payment/`) | `plugins/rehype-base-links.mjs` adds the base path, so links survive a domain change |
| Branding | PonchoPay Marketing Design System (claude.ai artifact) | Cream canvas, navy ink, mint as the action colour, Gellix, 2px ink outline + hard offset shadow. Tokens in `src/styles/theme.css` |
| Logo | `src/assets/logo-{light,dark}.svg`, favicon from the mark | Converted from the design system's vector `Logo` component, not redrawn |
| Porting source | Notion export in `notion-export/` (git-ignored, local only) | Same content as the live Notion page as of 24 Nov 2026 |
| Object definitions | One source: `src/data/schemas.ts`, rendered by `<Fields>` | A field is described once and appears the same on endpoint, webhook and object pages. Also a ready source for `llms.txt` and an OpenAPI spec later |
| Example bodies | Generated from the same definitions by `<Example>` (`src/lib/examples.ts`), using each field's `example` value | JSON and form examples can't drift from the parameter lists. Only language code (SDK calls, cURL, HTML) is written by hand |
| Webhook handling code | One partial, `src/partials/WebhookHandler.mdx`, used by the overview and all 10 event pages | Handler code in Node.js, Express, PHP and Python is written once |
| Navigation width | 17rem (Starlight default 18.75rem) | More room for parameters and code. 17rem is the narrowest that keeps every endpoint's method badge on one line |
| Shared demo key | Published on the Introduction page, as in Notion | Decided 24 Nov 2026: keep it |
| Nested objects | Expanded inline with "Show child parameters" (Stripe/Adyen pattern) | Readers never leave the page. `/objects/` pages remain as a reference and render from the same definitions |
| API page layout | Stripe-style two columns via `<ApiColumns>`: explanation and parameters left, code examples right (sticky). Stacks below 72rem | Code stays beside the parameters it shows. These pages hide "On this page" and use the full width |

## Phases

- [x] **1. Scaffold**: Starlight, theme from the design system, logo, fonts, deploy workflow, sidebar structure
- [x] **2. Pilot**: Initiate a payment and Payment completed, revised twice and approved
- [x] **3. Port the rest**: all endpoints, webhooks, redirects, objects and the Get started pages
- [x] **4. SDK walkthroughs**: `sdks/nodejs`, `sdks/php`, `sdks/browser`, each a walkthrough plus reference, written from the Notion SDK pages and the SDK source
- [ ] **5. Agent and LLM tooling**: `llms.txt` / `llms-full.txt`, copy-prompt, Agent Skill / Claude Code plugin with scripts (token, JWT, signature check, local webhook simulator), `AGENTS.md`
- [ ] **6. Go live**: custom domain, point `pay.ponchopay.com/api/docs` at the new site, leave a pointer on the Notion page, update Intercom links

## Page mapping

Status: ✅ done · ⬜ not started

### Main Notion page sections

| Notion section | Target page | Status |
| --- | --- | --- |
| Introduction, base URLs, Provider & user accounts, Integration key, Enabling payments, Google/Apple Pay, Connectivity | `getting-started/introduction` | ✅ |
| Token (synced block), JWT (repeated on every management endpoint), webhook signature | `getting-started/authentication` (all three schemes, once) | ✅ |
| Format and Nesting (synced block) | "Parameters" section on both initiate endpoints | ✅ |
| Webhook Callbacks, lifecycle, legacy lifecycle, modification webhooks, Security, bot identification | `webhooks/overview` | ✅ |
| Redirects | `redirects/payment-completed`, `redirects/subscription-set-up` | ✅ |
| Testing: test cards, Pay by Bank (Tink), Express TFC, testing callbacks, integration testing | `getting-started/testing` | ✅ |
| SDKs database | `sdks/nodejs`, `sdks/php`, `sdks/browser` | ✅ |

### Endpoints

| Notion page | Target page | Status |
| --- | --- | --- |
| Validate location | `endpoints/validate-location` | ✅ |
| Initiate a payment | `endpoints/initiate-payment` | ✅ |
| Initiate a subscription | `endpoints/initiate-subscription` | ✅ |
| Update a payment method | `endpoints/update-payment-method` | ✅ |
| Refund a payment method | `endpoints/refund-payment-method` | ✅ |
| Cancel a payment | `endpoints/cancel-payment` | ✅ (jwt.io screenshot replaced by a short tip on the Authentication page) |
| Cancel a subscription | `endpoints/cancel-subscription` | ✅ |

### Webhooks

All 10 ported to `webhooks/events/<event>`: payment captured, reported complete, completed, in
bank, updated, refunded, cancelled, and recurring payment captured, set up, cancel. ✅

### Objects (all in `src/data/schemas.ts`)

| Notion object | Where it appears | Status |
| --- | --- | --- |
| ValidateLocation, InitiatePayment, InitiateSubscription, UpdatePaymentMethod, RefundPaymentMethod | Their endpoint page | ✅ |
| PaymentCompleted, SubscriptionSetUp (identical) | One `RedirectBody` definition, on both redirect pages | ✅ |
| PaymentConstraints, LineItems, SubscriptionRepetition, SubscriptionEnding, PaymentCallback, Payment, PaymentMethod, Request, SubscriptionCallback, Subscription | Inline where used, plus a page under `/objects/` | ✅ |
| New: AdditionalPayment, WebhookHeaders, JwtClaims, path parameters | Inline where used | ✅ |

### SDKs

| Notion page | Target | Status |
| --- | --- | --- |
| pp-nodejs (+ 11 function pages) | `sdks/nodejs`: set up, take a payment, recurring payments, webhooks, manage payments, errors, reference | ✅ |
| pp-php (+ 8 function pages) | `sdks/php`: the same, with the shared webhook handler since the SDK has no helper | ✅ |
| pp-browser (+ pp-payment, pp-subscription) | `sdks/browser`: install, token, both components, customisation, behaviour, frameworks and SSR | ✅ |

SDK pages reuse the API definitions: `<Fields schema="InitiatePayment" omit={['token']} />` shows
the SDK parameters without duplicating them.

## Conventions

- **Every section is an `<ApiColumns>`**: prose and parameters in the default slot, code in
  `<Fragment slot="code">`. Set `tableOfContents: false` in the frontmatter. (Introduction and
  Testing are plain guide pages.)
- **Parameters**: add or reuse the object in `src/data/schemas.ts` and render it with
  `<Fields schema="…" />`. Never hand-write a parameter table. Point nested objects at their schema
  with `children`, list fixed values in `enum`, mark request fields `required` (or `requiredIf` for
  conditional ones) and response fields that may be missing `optional`. Each object is defined
  once: never copy fields between objects or into a page.
- **Example bodies**: never hand-write a request, webhook or redirect body. Give every field an
  `example` and use `<Example schema="…" />`. Defaults: required request fields, response fields
  that are always sent, and optional fields marked `inDefaultExample`. Use `include={[…]}` for
  optional fields, `overrides={{ … }}` for page-specific values (dotted paths reach nested values,
  such as `'payment.refunded_amount'`; `null` removes a field), `complete` on object pages and
  `format="form"` for form bodies. Unknown field names fail the build.
- **Endpoint pages** (Stripe order): overview with `<Endpoint>` on the right, Authentication,
  Parameters (example request tabs on the right in the order Node.js, PHP, pp-browser, HTML form,
  cURL, only those that apply), Returns (status codes, common error messages, example response on
  the right), What happens next.
- **Webhook pages**: overview with when it's sent and `<Event>` on the right, The event
  (`<Fields>` with the example body on the right), Handle the webhook (`<WebhookHandler />`), Test
  it.
- **Object pages**: one-line purpose, `<Fields schema="…" />`, and an `<Example>`.
- **SDK pages**: reuse the API definitions with `<Fields>` (`omit` hides fields the SDK fills in,
  such as `token`) and link each method to its endpoint page.
- **Language**: plain British English, sentence case. Use PonchoPay's terms: provider, parent,
  Tax-Free Childcare, childcare vouchers, recurring payment (the API calls it subscription), in
  bank. Amounts in pence with a £ example.
- **Examples** use the demo URN `INTTEST`, `metadata: 'order-67651'` (payments) or
  `'membership-2291'` (recurring payments), `parent@example.com`, and read the key from
  `PONCHOPAY_INTEGRATION_KEY`. Never inline a real key.
- **Accuracy**: when Notion and the code disagree, check `ponchocare/ponchopay` and note the change
  below.

## Changes from the Notion content (checked against the code)

- **Line items**: the sum of `amount × quantity` must equal `amount` (Notion said "sum of all line
  items"). `src/be/integration/dto/generic.initialise.ts`.
- **`PaymentCallback.updates`**: added. Sent on `payment_updated` only, with JSON paths of what
  changed. `src/be/integration/integrator/generic.integrator.ts`.
- **Error messages**: each endpoint lists the actual messages from its controller
  (`src/be/integration/controller.ts`, `src/be/subsidy/controller.ts`), including the refund
  endpoint's `409 Conflict` when a refund is already in progress.
- **Payment updated "When" text**: Notion's said "when the payment is cancelled" (a copy-paste
  slip). Now describes an amount or payment method change.
- **`provider_redirect`**: explained. It's only sent to booking platforms that integrate on a
  provider's behalf, when the provider also has a redirect URL
  (`src/components/configurable/redirectResolver.ts`). The handler examples check it against the
  provider's known URL to avoid an open redirect.
- **Type names**: Update a payment method uses `card`, `childcare-voucher`, `tax-free-childcare`,
  while webhooks use `credit_debit_card`, `childcare_vouchers`, `tax_free_childcare`. Both pages
  now call this out.
- **Refunds**: card payment methods, plus Tax-Free Childcare or voucher payment methods charged to
  the parent's card through the payment guarantee (`subsidy/manager.ts` `refund()`). Other Tax-Free
  Childcare and voucher refunds go through the scheme.
- **Redirects aren't proof of payment**: they're unsigned browser posts. The pages say to rely on
  webhooks.
- **Webhook handlers** use constant-time comparison and include a Python version.

## Parity review against the Notion export (24 Nov 2026)

Four parallel reviews compared every Notion page (main page, 7 endpoints, 10 callbacks, 2
redirects, 17 objects, 3 SDKs and their function pages) with the built site, field by field. About
60 differences were found. All were fixed to match Notion, except the deliberate ones below.

Restored from Notion, among others: the payment methods settings screenshot and checkbox names,
admin settings links, `paymentId` for Google Pay, the webhook implementation warning, the
"potentially unsafe" parsing note, the full jwt.io walkthrough with the example token, hashed key
and screenshot, "No response is expected", "manually retriggered" for resent events, the "Always
exists" meaning (a legend under every response field list), the voucher provider name rules in
full, expiry and constraints caveats on the additional payment, payment method scopes
(`payment_captured` for card and Express TFC, recurring captured for TFC and voucher recurring
payments, guarantee caveat for the whole event), Notion's wording for `amount`, `reference`,
`variant` and `ponchopay`, both callback objects' headers tables, the production base URL with
`/api/`, the test-callback instructions, the Express TFC result column, typed Node.js declarations,
and the SDK development commands. Inferences that weren't in Notion were removed (Klarna and Pay
by Bank in the captured scope, "one event per refund", "PonchoPay records your response").

Deliberate differences kept, because the code shows Notion was wrong or incomplete:

- **Integer amounts**: Notion types amounts as `number`. The site says `integer` because they're
  pence (`@IsInt()` in the DTOs).
- **`voucher_provider`**: Notion marks it optional. The site says it's required when the type
  changes to `childcare-voucher`, the only case where the endpoint returns `Voucher provider missing`
  (`src/be/subsidy/manager.ts`).
- **Refund limit**: Notion's SDK pages say the remaining amount "in the payment". The site says per
  payment method, as Notion's RefundPaymentMethod object does and the endpoint enforces.
- **`parseCallback` / `isValidCallback`**: they take a Fetch API `Request` (the SDK calls
  `request.clone()`, `headers.get()` and `text()`), not an Express `req`. Notion said "NodeJS
  request".
- **Notion copy-paste slip**: Notion's `isValidCallback` and `parseCallback` examples import
  `createToken`. The site imports the right function.
- **Recurring payment cancel**: also possible through the Cancel a subscription endpoint, not just
  the admin.
- **Mark in bank on demo**: Notion says it "can only be triggered on complete payments". The admin
  offers it for completed, reported-complete and late payments when reconciliation is on
  (`MarkInBank.svelte`), and card payment methods can't be marked
  (`CardSubsidyCannotBeMarkedInBankError`). The site says so, which is what makes Standard TFC and
  voucher `payment_completed` testable on demo.
- **Update a payment method type changes**: only between `tax-free-childcare` and
  `childcare-voucher` (`validateSchemeChange` in `src/be/subsidy/manager.ts`). A type change cancels
  the old payment method and creates a new one with a new ID, which `payment_updated` reports.
  Notion is silent; the update page and examples now follow the code.
- **Update a payment method limits**: Express checkout payments (`InvalidExpressPaymentUpdateError`)
  and payment methods that have already taken a payment (`HasNonZeroPaymentError`) can't be
  updated, and a request that changes nothing is a no-op. The `Invalid data` message mapped in the
  controller is never raised (`IsNotChildcareVoucherError` is never thrown), so it isn't listed.
- **Captured events and payment guarantee**: Notion says captured events aren't sent when payment
  guarantee is off. The code always sends `payment_captured` for card, Pay by Bank and Express TFC
  (`IntentManager.paymentCaptured` only records why the guarantee was skipped), and sends
  `recurring_payment_captured` for card recurring payments too, just before
  `recurring_payment_set_up` (`preauth.recursion.eventProcessor.ts`). The guarantee caveat is kept
  only for Standard TFC and voucher pre-authorisations.
- **Resent events** replay the stored body, so `payment` and `subscription` are described as the
  details when the event was first sent.
- **Error tables follow the code**: `Invalid body` only comes from the DTOs' `isValid()` checks;
  missing or wrong-type fields get a validation message naming the field. `Invalid repetition`
  can't be reached, `Invalid ending` means `ending.date` leaves no payments, and `Payments not
  enabled` means payment guarantee is on without a card payments account.
- **Endpoint headers** show paths relative to the documented base URL (`…/api/`); the full URLs
  underneath are unchanged.

A second pass (four parity reviews plus a cross-page consistency review) found 30 smaller items:
leftover inferences, missing caveats (payment guarantee on every captured event, card pre-auth
backing legacy completions), demo-account wording, redirect timing, Tink table columns, PHP
parameter names, an `isValidCallback` example, and examples that disagreed with each other (JWT
`sig`, line item totals, update vs `payment_updated`, recurring payment method IDs, demo hints).
All fixed.

Three questions Notion didn't answer, confirmed by the product owner on 24 Nov 2026 and now
documented:

- **Pay by Bank** works the same as card payments: `payment_captured` and `payment_completed` are
  sent together when checkout finishes.
- **No payment method, no webhook**: a payment has no payment method until the parent selects one,
  and no webhooks are sent before then. So cancelling a payment before a method is selected sends
  no `payment_cancelled`.
- **Refunds apply to payments only**: recurring payments generate payments and can't be refunded
  themselves, so the refund fields in a recurring payment's payment methods are always `0`.

## Open questions

1. **Gellix licence**: the font files are in `src/fonts/` and will be served from a public site
   and repo. Confirm the licence allows that, or switch to another typeface.
2. **Custom domain**: for example `developers.ponchopay.com`. Needs a DNS record and `public/CNAME`.
3. **SDK `initiateSubscription`**: the Initiate a subscription page uses the SDK method, as the
   Notion docs did (decided 24 Nov 2026). Possible bug still to verify on demo: pp-nodejs and pp-php
   post to `/api/integration/generic/subscription` (returns JSON) but expect a `302`, while the
   browser SDK uses `/subscription/redirect`. If it's confirmed, fix the SDKs or change the examples.
4. **Pay by Bank and Klarna refunds**: the refund page says card payment methods including Pay by
   Bank and Klarna can be refunded. Confirm.
5. **Commit and push**: nothing has been committed. Pushing to `main` deploys the site.

## SDK issues found while documenting (for the SDK repos, not the docs)

- **pp-browser**: `<pp-subscription>` only requires `repetition.weekdays` when granularity is
  `weekly` and `repetition.day` when it's `monthly`, but the API values are `week` and `month`. So
  the component never enforces them (`src/PpSubscription.ts`).
- **pp-nodejs**: `PPError` isn't exported from the package, so callers can't use `instanceof`. The
  docs tell them to check the `[PonchoPay]` message prefix.
- **pp-nodejs**: `isValidCallback` and `parseCallback` need a Fetch API `Request`. The Notion docs
  called it a "NodeJS request", and Express users can't pass `req`. The docs now say so. An
  Express-friendly helper (raw body string plus signature) would help.
- **pp-php**: no webhook verification helpers, unlike pp-nodejs.
- **pp-php**: needs PHP 8.4 and `symfony/http-client` 8, which rules out many shared hosts.
- **Both server SDKs**: errors include only the status code, not PonchoPay's error message.
- **Both server SDKs**: `initiateSubscription` may call the wrong endpoint (open question 3).

Resolved 24 Nov 2026: keep the shared demo key; keep `additional_one_time_payment.constraints`
documented; keep the "Auth check" label; sidebar widened to 17rem so badges fit.
