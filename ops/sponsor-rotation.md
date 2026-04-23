# Sponsor Key Rotation Runbook

Rotate the `SUI_SPONSOR_KEY` secret for the Astro Worker.

---

## When to rotate

- Suspected compromise of the sponsor keypair
- Scheduled quarterly security rotation
- Sponsor account balance near zero (consolidate first)

---

## Steps

### 1. Generate a new Ed25519 seed

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output — this is the new `SUI_SPONSOR_KEY` value.

### 2. Derive the new sponsor address

```bash
node -e "
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519')
const seed = Buffer.from('<paste_base64_here>', 'base64')
const kp = Ed25519Keypair.fromSecretKey(seed)
console.log('address:', kp.getPublicKey().toSuiAddress())
"
```

### 3. Fund the new address on testnet

```bash
curl -X POST https://faucet.testnet.sui.io/v1/gas \
  -H 'Content-Type: application/json' \
  -d '{"FixedAmountRequest":{"recipient":"<new_address>"}}'
```

For mainnet: transfer from existing sponsor wallet or exchange.
Minimum recommended balance: 1 SUI to cover ~100 sponsored transactions.

### 4. Verify the new address has coins

```bash
curl -s "https://fullnode.testnet.sui.io" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"suix_getBalance","params":["<new_address>","0x2::sui::SUI"]}'
```

Confirm `totalBalance` > 0 before proceeding.

### 5. Update the Cloudflare secret

```bash
# From one.ie repo root
wrangler secret put SUI_SPONSOR_KEY
# Paste the new base64 seed at the prompt
```

If there are multiple Worker environments (production / staging):
```bash
wrangler secret put SUI_SPONSOR_KEY --env production
```

### 6. Deploy

```bash
bun run deploy
```

The secret is loaded at call-time (`readSponsorKey()`) — no restart needed.
New requests will use the new key immediately after deploy.

### 7. Verify health

```bash
curl -X POST https://dev.one.ie/api/sponsor/build \
  -H 'Content-Type: application/json' \
  -d '{"sender":"0x0000000000000000000000000000000000000000000000000000000000000001","txKind":"transfer","params":{"to":"0x0000000000000000000000000000000000000000000000000000000000000001","amount":1}}'
```

Expected: HTTP 200 with `{ txBytes: [...], expiresAt: N }`.
If you get 503 `sponsor_unavailable`, the secret was not applied correctly.

### 8. Drain old address (optional)

Transfer remaining SUI from the old sponsor address to treasury before
revoking access. The old address is not burned — it simply stops being used
for gas once the secret is rotated.

---

## Rollback

If the new key is invalid or the Worker returns 503, restore the previous
secret immediately:

```bash
wrangler secret put SUI_SPONSOR_KEY
# Paste the old base64 seed
bun run deploy
```

---

## Notes

- `SUI_SPONSOR_KEY` is a Cloudflare Worker secret — never commit to `.env` for production
- The secret is read at request time; no cache — rotation takes effect on the next request after deploy
- `build.ts` and `execute.ts` both read the key independently; rotate once, both routes update
