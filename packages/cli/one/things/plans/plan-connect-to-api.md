# Plan: Connect /u features to pay.one.ie API

Status: Draft

Summary
-------
We found that many pages under `web/src/pages/u/*` (and their components) store demo or local data in localStorage (keys like `u_wallets`, `u_tokens`, `u_products`, `u_transactions`, `u_contacts`, `u_profile`, `u_keys`, `u_payments`, etc.). The pay.one.ie API exposes a wide set of protocols for payments, wallets, identity, prices, and access control which are a natural fit to replace local/demo data and power these features.

Goal
----
Replace local/demo flows in `/u` with production API calls to `https://pay.one.ie` (or `https://api.pay.one.ie`) via a small, testable PayService + client wrappers and a migration strategy so existing local storage is respected until users opt-in.

Findings (quick)
----------------
- Pages & components using local/demo storage (non-exhaustive):
  - UDashboard: `u_wallets`, `u_tokens`, `u_products`, `u_transactions`, `u_keys`
  - PeoplePage: `u_profile`, `u_contacts`, `u_payment_requests`
  - WalletsPage / WalletDetailPage: `u_wallets`, `u_keys`, `u_transactions`
  - TokensPage: `u_tokens`
  - ProductsPage / ProductDetailPage: `u_products`
  - TransactionsPage: `u_transactions`
  - ContractsPage: `u_contracts`
  - Send/Receive: `u_recent_recipients`, `u_send_prefill`
  - Payment tracker libraries: `u_payments` (PaymentStatusTracker)

- pay.one.ie capabilities discovered (via `GET https://pay.one.ie` and other endpoints):
  - Wallets: `wallet_generate`, `wallet_derive`, `wallet_recover`, `faucet_request`, `faucet_list`
  - Payments: `x402_quote`, `x402_claim`, `payment_link_create`, `payment_link_quote`, `payment_link_claim`
  - Identity & profile: `person_create`, `person_get`, `merchant_config`, `thing_create`, `thing_list`
  - Prices: `prices_get`, `prices_convert`
  - Access control / gating: `gatekeeper_check`, `gatekeeper_tier`, `access_sign`, `access_verify`
  - Subscriptions & credits: `subscription_*`, `credits_*`

Mapping: local/demo features -> pay.one protocols
-------------------------------------------------
- Wallets & keys
  - Local: `u_wallets`, `u_keys`
  - API: `wallet_derive` (deterministic agent wallets), `wallet_generate` (server-side generation), `wallet_recover`, `faucet_request` / `faucet_list` (testnet funding)
  - UI change: provide option to "Store locally" or "Back up to pay.one" for cloud-backed storage (opt-in)

- Tokens & balances
  - Local: `u_tokens`, token lists in UDashboard
  - API: `token_history`, `prices_get`, `prices_convert` to show USD values and histories

- Products and payments
  - Local: `u_products` used as sample shop items and local product detail
  - API: `payment_link_create` to generate pay.one.ie payment links and Cloudflare Worker endpoints (create_url `/pay/create`), `x402_quote` for agent purchases
  - Payment flows: product -> create payment link via PayService -> redirect to `https://pay.one.ie/pay/create` or `pay.one.ie/qr` -> listen for webhook/claim

- Transactions and payments tracking
  - Local: `u_transactions`, `u_payments`
  - API: use pay.one webhook & `payment_link_claim` / `x402_claim` to confirm payments; poll `https://api.pay.one.ie` (or subscribe to webhooks) and update local UI. PaymentStatusTracker should call the pay.one endpoints to reflect real status.

- People & identity
  - Local: `u_profile`, `u_contacts`
  - API: `person_create`, `person_get`, `person_update` to store contacts on pay.one (optionally), or mirror to local if user wants local-only

- Contracts / deployed artifacts
  - Local: `u_contracts` used in demo
  - API: use pay.one endpoints / agent indexing to record contract metadata, or call chain-specific tooling via pay.one's RPC and wallet services (e.g., merchant_config)

Technical Approach (high-level)
-------------------------------
1. Introduce a lightweight `PayService` client in `web/src/lib` or `web/src/components/u/lib/PayService.ts` (there is already a stub) that encapsulates:
   - base URL(s): `https://pay.one.ie` and `https://api.pay.one.ie`
   - auth handling (API keys / JWT) — local dev uses environment variables or a dev test API token
   - helpers: protocolRequest(protocolName, data) → POST { protocol: "name", data }
   - dedicated helpers: createPaymentLink, quoteX402, claimX402, walletGenerate, walletDerive, pricesGet, personCreate, etc.
2. Wrap existing UI to call PayService instead of localStorage for live flows; keep a local toggle or progressive migration so previously stored local records remain available.
3. Data modelling: map pay.one responses to our UI interfaces (Wallet, Token, Product, Transaction, Person). Add thin adapters in `components/u/adapters/*`.
4. Sync strategy:
   - Read-first: if the user has local data, show it and surface a "Sync to pay.one (backup)" action
   - For newly created data, prefer pay.one API and mirror results locally for offline UX and speed
   - Where user privacy matters, provide explicit opt-in to upload personal keys/profile
5. Offline & fallback:
   - Keep localStorage as an offline cache.
   - Use optimistic updates in the UI and verify via pay.one responses or webhooks.
6. Security & keys
   - Never send raw mnemonics or private keys to pay.one unless the user explicitly opts in and the feature is designed for cloud backup (with end-to-end encryption).
   - For agent wallets and hosted wallets, use `wallet_derive` to produce deterministic agent wallets server-side.
7. Rate limiting & caching
   - Cache price responses for 60–300s, cache small identity lookups, and use exponential back-off.
8. Backward-compatible API
   - Provide a short-term polyfill layer so components can use either localStorage or PayService with minimal changes.

Implementation Plan & Milestones
--------------------------------
Phase 0 — Design & Discovery (0.5 day)
  - Inventory all localStorage keys & flows (we've started this)
  - Verify pay.one API contracts & auth (API tokens) for staging
  - Create `one/things/plans/plan-connect-to-api` (this file)

Phase 1 — PayService & Adapters (1–2 days)
  - Create `web/src/lib/PayService.ts` wrapping endpoints & discovery
  - Add adapters for Wallet, Token, Product, Transaction, Person
  - Add unit tests & mock responses

Phase 2 — Integrate feature-by-feature (2–4 days)
  - Wallet flows: enable wallet_generate / wallet_derive / faucet_list
  - Products / Payments: createPaymentLink — update ProductsPage/ProductDetailPage
  - Prices: replace local price manipulation with prices_get
  - Transactions & tracking: hook PaymentStatusTracker to pay.one webhooks or API polling
  - People: add optional cloud-backed person_create / person_get

Phase 3 — Migration & QA (1–2 days)
  - Provide in-app migration UI (Backup to pay.one / Restore from pay.one)
  - End-to-end tests (payments and wallet flows)
  - Observability and logging

Phase 4 — Rollout
  - Feature flag release, beta test, full rollout. Provide admin dashboards & metrics.

Testing & QA
------------
- Unit tests for PayService request/response adapters
- Integration tests (mock pay.one responses via VCR or nock)
- End-to-end smoke test for full payment link flow (create link → simulate webhook → confirm claim)

Next actionable tasks (short)
----------------------------
1. Create `web/src/lib/PayService.ts` with a `protocolRequest(protocol, data)` wrapper and small helpers.
2. Replace `ProductsPage.tsx` payment-link generation to use PayService.createPaymentLink (TEST-mode first) and verify `ProductDetailPage` logic.
3. Add `Prices` adapter and update `EnhancedWalletCard` + `UDashboard` to call `prices_get` for USD values.
4. Implement `PaymentStatusTracker` integration to query pay.one and update `u_payments`.
5. Add a migration UI for `UDashboard` to allow exporting local data to pay.one (opt-in).

References & Useful Endpoints
----------------------------
- Discovery: POST https://pay.one.ie { protocol: "system_discovery" } or GET https://pay.one.ie (returns protocol list / info)
- Example agent endpoint: https://api.pay.one.ie/api/v1/agent/sync
- Payment pages: https://pay.one.ie/pay/create, https://pay.one.ie/qr, https://pay.one.ie/to/{address}
- OpenAPI / plugin manifest (if available): https://pay.one.ie/openapi.yaml, https://pay.one.ie/.well-known/ai-plugin.json

Security notes
--------------
- Ensure E2E encryption/user consent for any key uploads.
- Keep the default UX local-first — cloud backup only via clear opt-in.

Ownership & PR plan
-------------------
- Implement PayService + tests (owner: frontend engineer)
- Product/Payments integration (owner: frontend + backend for webhook support)
- QA & rollout (owner: product engineering)


-- End of draft plan --
