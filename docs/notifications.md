# Notification Routing

`src/lib/notify/` delivers events to users across three channels: Web Push, email, and HMAC-signed webhooks. Channel selection is driven by `UserNotifyPrefs` — an ordered list the caller supplies.

---

## Channels

### Push — `push.ts`

VAPID Web Push (RFC 8291). No SDK dependency — VAPID JWTs and AES-GCM payload encryption are implemented directly with the Web Crypto API.

**Encryption path:**

1. Generate ephemeral P-256 server keypair.
2. ECDH with the subscriber's `p256dh` key → shared secret.
3. HKDF-SHA256(shared, auth) → content encryption key + nonce.
4. AES-GCM encrypt payload (padded with 2-byte zero prefix).
5. POST to `subscription.endpoint` with `Authorization: vapid t=…,k=…` and `Content-Encoding: aesgcm`.

**Required env:**

| Variable | Purpose |
|----------|---------|
| `VAPID_PUBLIC_KEY` | base64url P-256 public key |
| `VAPID_PRIVATE_KEY` | base64url P-256 private key (PKCS8) |
| `VAPID_EMAIL` | `mailto:` contact sent in VAPID JWT |

VAPID JWT expires 12 hours after issue.

---

### Email — `email.ts`

Two providers, checked in priority order: Postmark → Resend.

| Variable | Provider |
|----------|---------|
| `POSTMARK_API_KEY` | Postmark (primary) |
| `RESEND_API_KEY` | Resend (secondary) |
| `NOTIFY_FROM_EMAIL` | Sender address (required for both) |

`detectEmailProvider()` returns `'postmark' | 'resend' | 'none'` based on which key is present. `sendEmail()` throws if neither is configured.

---

### Webhook — `webhook.ts`

HMAC-SHA256 signed HTTP POST. The signature is in `X-ONE-Signature: <hex>`.

**Signing:**

```
signature = HMAC-SHA256(JSON.stringify(payload), secret)
```

**Receiver verification:**

```typescript
import { verifyWebhook } from '@/lib/notify/webhook'

const valid = await verifyWebhook(rawBody, request.headers.get('X-ONE-Signature'), secret)
```

`verifyWebhook` uses `crypto.subtle.verify` — timing-safe, prevents timing attacks.

**Replay-attack protection:** The webhook payload always includes `timestamp: number` (epoch ms). Receivers should reject payloads where `Date.now() - payload.timestamp > 300_000` (5 minutes). This window is not enforced by the library — callers are responsible for the check.

---

## Router — `route.ts`

`routeNotification(prefs, event)` tries channels in the order specified by `prefs.channels`. Each failed channel is logged; the next channel is attempted. Returns on the first successful delivery. Throws an aggregated error if all channels fail.

```typescript
import { routeNotification } from '@/lib/notify/route'

await routeNotification(
  {
    channels: ['push', 'email', 'webhook'],
    pushSubscription: { endpoint: '...', keys: { p256dh: '...', auth: '...' } },
    email: 'alice@example.com',
    webhookUrl: 'https://hook.example.com/notify',
    webhookSecret: 'secret-hmac-key',
  },
  {
    event: 'payment:settled',
    title: 'Payment received',
    body: '0.5 SUI landed in your wallet.',
    data: { amount: '0.5', chain: 'sui' },
  },
)
```

### Fallback chain

```
push → fail → email → fail → webhook → fail → throw
```

The first channel that delivers short-circuits the rest. `prefs.channels` controls priority — put the most reliable channel last if you need guaranteed delivery.

### Error aggregation

If all channels fail, the thrown error message enumerates each failure:

```
All notification channels failed — push: VAPID_PUBLIC_KEY is not set; email: No email provider configured; webhook: ...
```

---

## Types

```typescript
interface UserNotifyPrefs {
  channels: NotifyChannel[]          // ordered: first = highest priority
  pushSubscription?: { endpoint: string; keys: { p256dh: string; auth: string } }
  email?: string
  webhookUrl?: string
  webhookSecret?: string
}

interface NotifyEvent {
  event: string    // e.g. "signal:received", "payment:settled"
  title: string    // push title / email subject
  body: string     // push body / email text
  icon?: string    // push icon URL
  data?: Record<string, unknown>  // structured payload (webhook + push data field)
}
```

---

## Source files

| File | Purpose |
|------|---------|
| `src/lib/notify/push.ts` | VAPID push delivery |
| `src/lib/notify/email.ts` | Postmark / Resend email delivery |
| `src/lib/notify/webhook.ts` | HMAC-signed webhook delivery + verification |
| `src/lib/notify/route.ts` | Multi-channel router with fallback |
