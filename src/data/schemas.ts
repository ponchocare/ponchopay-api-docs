/**
 * API object definitions: the single source for every parameter list on the site.
 *
 * Endpoint pages, webhook pages and object pages all render these with <Fields>, so a field is
 * described once and nested objects can be expanded inline ("Show child parameters").
 *
 * Descriptions are Markdown. Link between pages with root-relative links ("/objects/payment/").
 */

export interface EnumValue {
  value: string;
  description: string;
}

export interface Field {
  name: string;
  /** Shown next to the name: "string", "integer", "object", "array of objects"… */
  type: string;
  /** Request fields: must be sent. */
  required?: boolean;
  /** Request fields that are required only in some cases, e.g. "granularity is week". */
  requiredIf?: string;
  /** Response/webhook fields: may be missing. Shown as "Optional". */
  optional?: boolean;
  description: string;
  enum?: EnumValue[];
  /** Name of the schema (a key of `schemas`) describing this field's child parameters. */
  children?: string;
  /**
   * Example value used to build the example JSON on the page (see src/lib/examples.ts).
   * Fields with children get their example from the child schema instead.
   */
  example?: unknown;
  /** Show this optional field in default examples (it's usually sent). */
  inDefaultExample?: boolean;
}

export interface Schema {
  title: string;
  /** Request objects are sent to PonchoPay; response objects are sent by PonchoPay. */
  kind: 'request' | 'response';
  description: string;
  fields: Field[];
}

const PAYMENT_METHOD_TYPES: EnumValue[] = [
  { value: 'tax_free_childcare', description: 'Paid with Tax-Free Childcare.' },
  { value: 'childcare_vouchers', description: 'Paid with childcare vouchers.' },
  { value: 'credit_debit_card', description: 'Paid with a credit or debit card.' },
];

export const schemas = {
  InitiatePayment: {
    title: 'InitiatePayment',
    kind: 'request',
    description: 'The body of an [Initiate a payment](/endpoints/initiate-payment/) request.',
    fields: [
      {
        name: 'urn',
        type: 'string',
        example: 'INTTEST',
        required: true,
        description: "The location's Unique Reference Number. It must belong to one of your locations.",
      },
      {
        name: 'amount',
        type: 'integer',
        example: 1256,
        required: true,
        description: 'Amount to pay, in pence. £12.56 is `1256`.',
      },
      {
        name: 'metadata',
        type: 'string',
        example: 'order-67651',
        required: true,
        description:
          "Your own reference for this payment, such as an order ID. It's returned unchanged in every webhook for this payment, and it's part of the `token`.",
      },
      {
        name: 'email',
        type: 'string',
        example: 'parent@example.com',
        required: true,
        description: 'Email address of the parent who will pay.',
      },
      {
        name: 'token',
        type: 'string',
        example: 'TOKEN_FROM_YOUR_SERVER',
        required: true,
        description: 'The [authentication token](/getting-started/authentication/#initiation-token), computed from your integration key and this request\'s `metadata`.',
      },
      {
        name: 'note',
        type: 'string',
        example: 'Summer holiday club',
        description: 'Text attached to the payment and shown with it.',
      },
      {
        name: 'expiry',
        type: 'string',
        example: '2026-12-31T23:59:59.000Z',
        description:
          'When the payment expires, as an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date-time. It must be at least 10 minutes after the request. Defaults to 30 days. The parent has until then to add their card details (you get the [`payment_captured`](/webhooks/events/payment-captured/) webhook when they do, if payment guarantee is turned on). Once a payment has expired, nothing more can be done with it.',
      },
      {
        name: 'constraints',
        type: 'object',
        description: "Rules for how the payment can be split across payment methods. No constraints apply if it's left out.",
        children: 'PaymentConstraints',
      },
      {
        name: 'line_items',
        type: 'array of objects',
        description:
          'What the payment is for. **Required to offer Klarna.** The sum of `amount × quantity` across all items must equal `amount`.',
        children: 'LineItem',
      },
    ],
  },

  PaymentConstraints: {
    title: 'PaymentConstraints',
    kind: 'request',
    description: 'Optional rules for how a payment can be paid.',
    fields: [
      {
        name: 'minimum_card_amount',
        type: 'integer',
        example: 500,
        description:
          "The least that must be paid by card, in pence (£1.23 is `123`). It can't be more than the payment's `amount`, and card payments must be turned on for the provider.",
      },
    ],
  },

  LineItem: {
    title: 'LineItem',
    kind: 'request',
    description: 'One item a payment is for. Line items are required to offer Klarna.',
    fields: [
      {
        name: 'description',
        type: 'string',
        example: 'Holiday club day',
        required: true,
        description: 'What\'s being paid for, such as "Holiday club day".',
      },
      {
        name: 'amount',
        type: 'integer',
        example: 2000,
        required: true,
        description: 'Price of one item, in pence.',
      },
      {
        name: 'quantity',
        type: 'integer',
        example: 2,
        required: true,
        description: 'How many of the item.',
      },
    ],
  },

  PaymentCallback: {
    title: 'PaymentCallback',
    kind: 'response',
    description: 'The body of every payment webhook.',
    fields: [
      {
        name: 'id',
        type: 'string',
        example: '0f8b6a52-3c1e-4c55-9d6b-7a1f2e9c4d10',
        description:
          'Unique ID for this event. If the event is manually resent from PonchoPay, it keeps the same ID, so use it to skip events you\'ve already handled.',
      },
      {
        name: 'date',
        type: 'string',
        example: '2026-11-24T10:15:30.000Z',
        description:
          'When the event was first sent, as an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date-time. A manually resent event keeps the original date.',
      },
      {
        name: 'event',
        type: 'string',
        example: 'payment_completed',
        description: 'Which event this is.',
        enum: [
          { value: 'payment_captured', description: 'The parent made a card payment, or completed the card pre-authorisation for a Tax-Free Childcare or voucher payment. Not sent if payment guarantee is turned off.' },
          { value: 'payment_updated', description: 'The amount or a payment method changed.' },
          { value: 'payment_reported_complete', description: "The parent says they've paid outside PonchoPay." },
          { value: 'payment_completed', description: "The payment is done and the money will reach the provider." },
          { value: 'payment_in_bank', description: "PonchoPay found the payment in the provider's bank account." },
          { value: 'payment_refunded', description: 'All or part of the payment was refunded.' },
          { value: 'payment_cancelled', description: 'The payment was cancelled.' },
        ],
      },
      {
        name: 'payment',
        type: 'object',
        description: "The payment's current details.",
        children: 'Payment',
      },
      {
        name: 'request',
        type: 'object',
        description: 'Details from the request that created the payment.',
        children: 'Request',
      },
      {
        name: 'updates',
        type: 'array of strings',
        example: ['$.payment.amount'],
        optional: true,
        description:
          'Only on `payment_updated`. JSON paths of the fields that changed, such as `$.payment.amount` or `$.payment.payment_methods[0]`.',
      },
    ],
  },

  Payment: {
    title: 'Payment',
    kind: 'response',
    description: 'A payment as it appears in webhooks. Amounts are in pence.',
    fields: [
      {
        name: 'id',
        type: 'string',
        example: '6d2f1c7e-8a4b-4f0e-b3a9-5c8e1d2f7a60',
        description:
          "The payment's unique ID (a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier)). Use it to [cancel the payment](/endpoints/cancel-payment/).",
      },
      {
        name: 'reference',
        type: 'string',
        example: 'PP4X7K2Q',
        description: 'Short reference that makes the payment easy to identify.',
      },
      {
        name: 'amount',
        type: 'integer',
        example: 4274,
        description: 'The payment amount, in pence.',
      },
      {
        name: 'refunded_amount',
        type: 'integer',
        example: 0,
        description: "The amount of the refund that triggered this event. It's `0` on every event except `payment_refunded`.",
      },
      {
        name: 'refunded_total',
        type: 'integer',
        example: 0,
        description: 'The total refunded so far. Never more than `amount`.',
      },
      {
        name: 'method',
        type: 'string',
        example: 'credit_debit_card',
        description: 'How the payment was paid. See `payment_methods` for the detail of each method.',
        enum: [
          ...PAYMENT_METHOD_TYPES,
          {
            value: 'ponchopay',
            description: "The method couldn't be determined, or more than one payment method was used (for example, a split payment).",
          },
        ],
      },
      {
        name: 'payment_methods',
        type: 'array of objects',
        description: 'Each payment method used and how much it paid.',
        children: 'PaymentMethod',
      },
    ],
  },

  PaymentMethod: {
    title: 'PaymentMethod',
    kind: 'response',
    description: 'One payment method of a payment or recurring payment. A split payment has one entry per method.',
    fields: [
      {
        name: 'id',
        type: 'string',
        example: 'a1c3e5f7-2b4d-4f6a-8c0e-1d3f5a7c9e20',
        description: "The payment method's ID. Use it to [update](/endpoints/update-payment-method/) or [refund](/endpoints/refund-payment-method/) this part of the payment.",
      },
      {
        name: 'type',
        type: 'string',
        example: 'credit_debit_card',
        description: 'The kind of payment method.',
        enum: [
          ...PAYMENT_METHOD_TYPES,
          { value: 'ponchopay', description: "The method couldn't be determined." },
        ],
      },
      {
        name: 'variant',
        type: 'string',
        example: 'visa',
        optional: true,
        inDefaultExample: true,
        description: 'More detail about the method. The values depend on `type`.',
        enum: [
          { value: 'instant', description: '`tax_free_childcare` paid with Express checkout.' },
          { value: 'manual', description: '`tax_free_childcare` paid any other way, for example with Standard checkout.' },
          {
            value: 'edenred, sodexo, fair_care, …',
            description: '`childcare_vouchers`: the voucher provider.',
          },
          {
            value: 'visa, mc, amex, klarna, klarna_account, paybybank, …',
            description:
              '`credit_debit_card`: the card brand or method. Only sent once the payment has been taken or the recurring payment set up, and may be missing for older payments and recurring payments.',
          },
        ],
      },
      {
        name: 'amount',
        type: 'integer',
        example: 4274,
        description: 'The amount allocated to this payment method, in pence.',
      },
      {
        name: 'refunded_amount',
        type: 'integer',
        example: 0,
        description: 'The amount of the refund that triggered this event, if it was for this method. Otherwise `0`.',
      },
      {
        name: 'refunded_total',
        type: 'integer',
        example: 0,
        description: 'The total refunded from this method so far. Never more than `amount`.',
      },
    ],
  },

  Request: {
    title: 'Request',
    kind: 'response',
    description: 'Details from the request that created the payment or recurring payment.',
    fields: [
      {
        name: 'metadata',
        type: 'string',
        example: 'order-67651',
        description:
          'The `metadata` you sent when you [initiated the payment](/endpoints/initiate-payment/) or [recurring payment](/endpoints/initiate-subscription/), unchanged. Use it to find the order in your system.',
      },
    ],
  },

  WebhookHeaders: {
    title: 'Webhook headers',
    kind: 'response',
    description: 'HTTP headers sent with every webhook.',
    fields: [
      {
        name: 'signature',
        type: 'string',
        description:
          'HMAC-SHA256 signature of the raw body, made with your integration key. [Verify it](/webhooks/overview/#verify-and-handle-webhooks) before you trust the body.',
      },
      {
        name: 'content-type',
        type: 'string',
        description: 'Always `application/json`.',
      },
      {
        name: 'user-agent',
        type: 'string',
        description: '`PonchoPay/<version>`. Use it to recognise requests from PonchoPay.',
      },
    ],
  },

  SubscriptionCallback: {
    title: 'SubscriptionCallback',
    kind: 'response',
    description: 'The body of every recurring payment webhook.',
    fields: [
      {
        name: 'id',
        type: 'string',
        example: '7c2e9a14-5b3d-4e8f-a1c6-9d0b2f4e6a81',
        description:
          "Unique ID for this event. If the event is manually resent from PonchoPay, it keeps the same ID, so use it to skip events you've already handled.",
      },
      {
        name: 'date',
        type: 'string',
        example: '2026-11-24T10:15:30.000Z',
        description:
          'When the event was first sent, as an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date-time. A manually resent event keeps the original date.',
      },
      {
        name: 'event',
        type: 'string',
        example: 'recurring_payment_set_up',
        description: 'Which event this is.',
        enum: [
          {
            value: 'recurring_payment_captured',
            description: 'The parent completed the card pre-authorisation for a Tax-Free Childcare or voucher recurring payment. Not sent if payment guarantee is turned off.',
          },
          {
            value: 'recurring_payment_set_up',
            description: 'The recurring payment is ready to take payments.',
          },
          {
            value: 'recurring_payment_cancel',
            description: 'The recurring payment was cancelled and will take no more payments.',
          },
        ],
      },
      {
        name: 'subscription',
        type: 'object',
        description: "The recurring payment's current details.",
        children: 'Subscription',
      },
      {
        name: 'request',
        type: 'object',
        description: 'Details from the request that created the recurring payment.',
        children: 'Request',
      },
    ],
  },

  Subscription: {
    title: 'Subscription',
    kind: 'response',
    description: 'A recurring payment as it appears in webhooks. Amounts are in pence.',
    fields: [
      {
        name: 'id',
        type: 'string',
        example: 'e4b8c2d6-1f3a-4c5e-9b7d-2a6f8e0c4b19',
        description:
          "The recurring payment's unique ID (a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier)). Use it to [cancel the recurring payment](/endpoints/cancel-subscription/).",
      },
      {
        name: 'reference',
        type: 'string',
        example: 'PR9M3T5W',
        description: 'Short reference that makes the recurring payment easy to identify.',
      },
      {
        name: 'amount',
        type: 'integer',
        example: 8500,
        description: 'The recurring payment amount, in pence.',
      },
      {
        name: 'payment_methods',
        type: 'array of objects',
        description: 'The payment methods set up for the recurring payment.',
        children: 'PaymentMethod',
      },
    ],
  },

  RedirectBody: {
    title: 'Redirect body',
    kind: 'response',
    description: "Form fields posted to your redirect URL when the parent is sent back to your site.",
    fields: [
      {
        name: 'metadata',
        type: 'string',
        example: 'order-67651',
        description:
          'The `metadata` you sent when you initiated the payment or recurring payment, unchanged.',
      },
      {
        name: 'provider_redirect',
        type: 'string',
        optional: true,
        example: 'https://club.example.com/thank-you',
        description:
          "Only sent to booking platforms that integrate on a provider's behalf, when the provider has also set a redirect URL. Send the parent on to this URL after you've handled the redirect.",
      },
    ],
  },

  ValidateLocation: {
    title: 'ValidateLocation',
    kind: 'response',
    description: 'Whether a location can take payments, and with which payment methods.',
    fields: [
      {
        name: 'verification_status',
        type: 'boolean',
        example: true,
        description: 'Whether the location is verified. Only verified locations can take payments.',
      },
      {
        name: 'card_payments_enabled',
        type: 'boolean',
        example: true,
        description: 'Whether the location can take card and bank payments.',
      },
      {
        name: 'childcare_voucher_payments_enabled',
        type: 'boolean',
        example: true,
        description: 'Whether the location can take childcare vouchers.',
      },
      {
        name: 'tax_free_childcare_payments_enabled',
        type: 'boolean',
        example: false,
        description: 'Whether the location can take Tax-Free Childcare.',
      },
    ],
  },

  InitiateSubscription: {
    title: 'InitiateSubscription',
    kind: 'request',
    description: 'The body of an [Initiate a subscription](/endpoints/initiate-subscription/) request.',
    fields: [
      {
        name: 'urn',
        type: 'string',
        required: true,
        example: 'INTTEST',
        description: "The location's Unique Reference Number. It must belong to one of your locations.",
      },
      {
        name: 'amount',
        type: 'integer',
        required: true,
        example: 8500,
        description: 'Amount to take each time, in pence. £85.00 is `8500`.',
      },
      {
        name: 'metadata',
        type: 'string',
        required: true,
        example: 'membership-2291',
        description:
          "Your own reference for this recurring payment. It's returned unchanged in every webhook for it, and it's part of the `token`.",
      },
      {
        name: 'email',
        type: 'string',
        required: true,
        example: 'parent@example.com',
        description: 'Email address of the parent the recurring payment is for.',
      },
      {
        name: 'token',
        type: 'string',
        required: true,
        example: 'TOKEN_FROM_YOUR_SERVER',
        description:
          'The [authentication token](/getting-started/authentication/#initiation-token), computed from your integration key and this request\'s `metadata`.',
      },
      {
        name: 'note',
        type: 'string',
        example: 'After-school club, autumn term',
        description: 'Text attached to the recurring payment and shown with it.',
      },
      {
        name: 'repetition',
        type: 'object',
        required: true,
        description: 'How often a payment is taken.',
        children: 'SubscriptionRepetition',
      },
      {
        name: 'ending',
        type: 'object',
        description:
          "When the recurring payment stops. If it's left out, it carries on until it's cancelled.",
        children: 'SubscriptionEnding',
      },
      {
        name: 'additional_one_time_payment',
        type: 'object',
        description:
          'A one-off payment taken while the recurring payment is set up, for example a registration fee, or a one-off item in the same basket. The parent pays it first. Only the fields below are used: the payment takes the recurring payment\'s `urn` and `email`, and `token` and `line_items` aren\'t used.',
        children: 'AdditionalPayment',
      },
    ],
  },

  SubscriptionRepetition: {
    title: 'SubscriptionRepetition',
    kind: 'request',
    description: 'How often a recurring payment takes a payment. The fields depend on `granularity`.',
    fields: [
      {
        name: 'granularity',
        type: 'string',
        required: true,
        example: 'month',
        description: 'The unit of time between payments.',
        enum: [
          { value: 'day', description: 'Every `period` days.' },
          { value: 'week', description: 'Every `period` weeks, on the given `weekdays`.' },
          { value: 'month', description: 'Every `period` months, on the given `day`.' },
          { value: 'year', description: 'Every `period` years.' },
        ],
      },
      {
        name: 'period',
        type: 'integer',
        required: true,
        example: 1,
        description: 'How many units of `granularity` between payments. `2` with `month` is every other month.',
      },
      {
        name: 'weekdays',
        type: 'array of strings',
        requiredIf: 'granularity is week',
        example: ['monday'],
        description:
          'The days of the week to take a payment, each listed once: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday` or `sunday`.',
      },
      {
        name: 'day',
        type: 'integer',
        requiredIf: 'granularity is month',
        inDefaultExample: true,
        example: 1,
        description: 'The day of the month to take a payment.',
      },
    ],
  },

  SubscriptionEnding: {
    title: 'SubscriptionEnding',
    kind: 'request',
    description: 'When a recurring payment stops taking payments. The fields depend on `condition`.',
    fields: [
      {
        name: 'condition',
        type: 'string',
        required: true,
        example: 'occurrences',
        description: 'How the recurring payment ends.',
        enum: [
          { value: 'never', description: "It carries on until it's cancelled." },
          { value: 'occurrences', description: 'After a number of payments.' },
          { value: 'date', description: 'On a date.' },
        ],
      },
      {
        name: 'occurrences',
        type: 'integer',
        requiredIf: 'condition is occurrences',
        inDefaultExample: true,
        example: 12,
        description: 'How many payments to take. At least `1`.',
      },
      {
        name: 'date',
        type: 'string',
        requiredIf: 'condition is date',
        example: '2027-07-31',
        description:
          'The date the recurring payment stops taking payments, as an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date. If the date is very far ahead the request is rejected: use `never` instead.',
      },
    ],
  },

  AdditionalPayment: {
    title: 'AdditionalPayment',
    kind: 'request',
    description:
      'A one-off payment taken while a recurring payment is set up. It uses the recurring payment\'s `urn` and `email`.',
    fields: [
      {
        name: 'amount',
        type: 'integer',
        required: true,
        example: 2500,
        description: 'Amount to pay, in pence.',
      },
      {
        name: 'metadata',
        type: 'string',
        required: true,
        example: 'membership-2291-registration',
        description:
          'Your own reference for the one-off payment. It\'s returned unchanged in the webhooks for that payment. It isn\'t part of the `token`.',
      },
      {
        name: 'note',
        type: 'string',
        example: 'Registration fee',
        description: 'Text attached to the payment and shown with it.',
      },
      {
        name: 'expiry',
        type: 'string',
        description:
          'When the payment expires, as an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date-time. It must be at least 10 minutes after the request. Defaults to 30 days. The parent has until then to add their card details. Once a payment has expired, nothing more can be done with it.',
      },
      {
        name: 'constraints',
        type: 'object',
        description: "Rules for how the payment can be split across payment methods. No constraints apply if it's left out.",
        children: 'PaymentConstraints',
      },
    ],
  },

  UpdatePaymentMethod: {
    title: 'UpdatePaymentMethod',
    kind: 'request',
    description: 'The body of an [Update a payment method](/endpoints/update-payment-method/) request.',
    fields: [
      {
        name: 'type',
        type: 'string',
        required: true,
        example: 'childcare-voucher',
        description:
          'The payment method type. These names differ from the ones in webhooks (`credit_debit_card`, `childcare_vouchers`, `tax_free_childcare`).',
        enum: [
          { value: 'card', description: 'Card, including Apple Pay, Google Pay, Klarna and Pay by Bank.' },
          { value: 'childcare-voucher', description: 'Childcare vouchers. Send `voucher_provider` too.' },
          { value: 'tax-free-childcare', description: 'Tax-Free Childcare.' },
        ],
      },
      {
        name: 'amount',
        type: 'integer',
        required: true,
        example: 4274,
        description: 'The new amount for this payment method, in pence.',
      },
      {
        name: 'voucher_provider',
        type: 'string',
        requiredIf: 'type is childcare-voucher',
        inDefaultExample: true,
        example: 'cooperating_helping_4ever',
        description:
          "The voucher provider's name, made completely lowercase, with every symbol removed (anything except letters, numbers and spaces), each space replaced by `_`, and repeated `_` collapsed into one. For example, `Co-operating & Helping 4ever` becomes `cooperating_helping_4ever`.",
      },
    ],
  },

  RefundPaymentMethod: {
    title: 'RefundPaymentMethod',
    kind: 'request',
    description: 'The body of a [Refund a payment method](/endpoints/refund-payment-method/) request.',
    fields: [
      {
        name: 'amount',
        type: 'integer',
        required: true,
        example: 1000,
        description:
          "Amount to refund, in pence. More than `0`, and no more than what's left to refund on this payment method.",
      },
    ],
  },

  JwtClaims: {
    title: 'JWT claims',
    kind: 'request',
    description: 'The payload of the JWT used to authenticate management requests.',
    fields: [
      {
        name: 'urn',
        type: 'string',
        required: true,
        example: 'INTTEST',
        description: "The location's Unique Reference Number.",
      },
      {
        name: 'email',
        type: 'string',
        required: true,
        example: 'admin@club.example.com',
        description:
          "Who's making the request. It's only used to know who authored it, and it doesn't have to belong to a PonchoPay user.",
      },
      {
        name: 'sig',
        type: 'string',
        required: true,
        example: '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
        description:
          'Hash of the exact request body you send: `base64(sha256(body))`. For requests with no body, hash an empty string.',
      },
      {
        name: 'iat',
        type: 'integer',
        required: true,
        example: 1795518000,
        description: 'Issued at, in seconds since the Unix epoch ([RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.6)).',
      },
      {
        name: 'exp',
        type: 'integer',
        required: true,
        example: 1795518005,
        description:
          'Expiry, in seconds since the Unix epoch. PonchoPay rejects tokens that expire more than 5 seconds after `iat`, so create a new token for each request ([RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.4)).',
      },
    ],
  },

  PaymentMethodPath: {
    title: 'Path parameters',
    kind: 'request',
    description: 'Path parameters for payment method endpoints.',
    fields: [
      {
        name: 'paymentMethodId',
        type: 'string',
        required: true,
        description:
          'The payment method\'s ID, from `payment.payment_methods[].id` in [payment webhooks](/objects/payment-method/).',
      },
    ],
  },

  PaymentPath: {
    title: 'Path parameters',
    kind: 'request',
    description: 'Path parameters for payment endpoints.',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: "The payment's ID, from `payment.id` in [payment webhooks](/objects/payment/).",
      },
    ],
  },

  SubscriptionPath: {
    title: 'Path parameters',
    kind: 'request',
    description: 'Path parameters for recurring payment endpoints.',
    fields: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description:
          "The recurring payment's ID, from `subscription.id` in [recurring payment webhooks](/objects/subscription/).",
      },
    ],
  },
} satisfies Record<string, Schema>;

export type SchemaName = keyof typeof schemas;
