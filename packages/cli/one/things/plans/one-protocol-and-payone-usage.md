# one-protocol & pay.one usage audit — /u area

Date: 2025-12-07

Goal
----
List everywhere in the Universal Wallet (`/u`) area and related components where the pay.one API is already in use, where the one-protocol SDK is already used, and where neither is used (local/demo-only). This helps us plan a consistent migration and determine where to prefer one-protocol vs pay.one.

Summary
-------
We scanned the `web/src/components/u` and `web/src/pages/u` code and documented the following:

- pay.one (pay.one.ie) is already used for payments, payment links, pricing conversions, and payment tracking in multiple UI places.
- one-protocol SDK is used for wallet operations in some places (WalletProtocol.ts + UDashboard), but many components still use local, demo-only implementations for wallets, tokens, transactions, people, and keys.

Detailed file-by-file usage
---------------------------
Legend: [PAY] = pay.one used (API/PayService), [SDK] = one-protocol SDK used, [LOCAL] = local/demo-only (localStorage or mock).

Top-level UA components (web/src/components/u)
- UDashboard.tsx — [SDK] Wallet generation uses `generateWallet` from `lib/WalletProtocol.ts` (one-protocol). (Also uses localStorage for display & caching.)
- WalletProtocol.ts — [SDK] Contains `generateWallet`, `deriveWallet`, and helpers using `one-protocol` imports (wallet_generate, wallet_derive, AddressSchema). (SDK present and used here.)
- PayService.ts — [PAY] Centralized pay.one wrappers. Provides payment link helpers, convertCurrency, generateWallet helper that talks to pay.one endpoints. (API integration exists here.)
- PaymentStatusTracker.ts — [PAY] Tracks pay.one payments and local `u_payments` storage logic.
- WalletCard.tsx — [PAY] Uses `PayService` helpers (getPaymentUrl, getPaymentQRUrl, openPaymentWindow) and directly opens pay.one URLs for send/swap/export.
- EnhancedWalletCard.tsx — [PAY + LOCAL] Uses `convertCurrency` (pay.one) for USD conversions, but saves transactions and sample operations to localStorage (`u_transactions`).
- WalletOnboardingCarousel.tsx — [LOCAL] reads `u_keys` from localStorage (onboarding contexts) — local-only.
- GenerateWalletDialog.tsx — [LOCAL / SDK through consumer] UI only; onGenerate passed by parent (UDashboard uses SDK, WalletsPage uses local implementation). So dialog is neutral but behavior depends on parent.
- MobileOnboarding.tsx — [SDK / LOCAL mixed] calls onGenerate which may be SDK-based in UDashboard.

Pages under web/src/components/u/pages
- WalletsPage.tsx — [LOCAL] Local-only generation (generateAddress/generatePrivateKey), stores in `u_wallets` and `u_keys` localStorage. No pay.one, no one-protocol SDK usage.
- WalletDetailPage.tsx — [LOCAL] Reads `u_wallets` and `u_transactions` from localStorage; UI only.
- KeysPage.tsx — [LOCAL] Local-only key storage `u_keys` and UI warnings.
- PeoplePage.tsx — [LOCAL] Local-only `u_profile`, `u_contacts` storage and operations (no pay.one or SDK person_* use).
- SendPage.tsx — [LOCAL + PAY links] Uses local prefill `u_send_prefill` etc; but can open pay.one send links (payment via pay.one). Not using one-protocol SDK.
- ReceivePage.tsx / ReceiveDetailPage.tsx — [PAY + LOCAL] Receive UI reads local `u_wallets` but uses pay.one links (to/qr link generation).
- ProductsPage.tsx — [PAY] Generates payment links via pay.one (PAY_WORKER_URL = https://pay.one.ie). Uses localStorage `u_products` as products but uses pay.one for checkout links.
- ProductDetailPage.tsx — [PAY + LOCAL] Builds pay.one payment links and passes wallets list to pay.one; product data stored locally in `u_products`.
- TokensPage.tsx — [LOCAL] Local-only token creation & storage in `u_tokens` with TODO to integrate deployment service (pay.one or others).
- TransactionsPage.tsx — [LOCAL] Stores `u_transactions` in localStorage; generates sample data when empty.
- ContractsPage.tsx — [LOCAL] contract templates and AI-powered flows; uses secure storage but contract deployment integration is not implemented (may use pay.one in future). Contains local model usage and prompts.

Other U utilities & small components
- ReceiveSheet.tsx — [PAY] Generates pay.one link `https://pay.one.ie/to/${address}` (PAY usage).
- sheets/SwapSheet.tsx, SendSheet.tsx — [LOCAL] UI for swap/trade actions; mostly mock/placeholder.
- Hooks (useCurrencyConversion.ts) — [PAY] may call PayService or use convert functions; confirm if used elsewhere.

Server / API endpoints referencing pay.one
- web/src/pages/api/v1/resource.ts — [PAY] Example resource using pay.one endpoints (demo / discovery text present).
- web/src/pages/api/v1/agent/sync.ts — [PAY] Example agent sync payload referencing pay.one tutor/stream, create_url `https://pay.one.ie/pay/create`.

Where the one-protocol SDK is used outside /u
- `web/src/AGENTS.md`, `web/CLAUDE.md`, and various docs reference `one-protocol` SDK usage for schemas, registry, etc.
- The repo includes `apps/one-core/packages/one-protocol` which is the SDK source and is present in package.json dependencies for web.

High-level observations
-----------------------
- Payments (checkout flow, payment links, price conversion, tracking) already use pay.one across multiple components (PayService, PaymentsTracker, Product pages, wallet quick-actions). Good coverage.
- Wallet generation is inconsistent:
  - UDashboard and some onboarding flows use the `one-protocol` SDK via `WalletProtocol.generateWallet` (SDK-based) — ideal.
  - WalletsPage and some lower-level utilities still use ad-hoc local mock generation (generateAddress/generatePrivateKey) — we should consolidate to `one-protocol` SDK across all wallet creation paths.
- Identity (people/profile) is local-only but pay.one provides person_* and identity endpoints. We should decide whether to mirror contacts to pay.one (opt-in) and/or use one-protocol `person_*` schemas for validation.
- Tokens, contracts, and transactions are largely local/demo-only. pay.one and one-protocol have tools to deploy tokens, manage contracts, token history and on-chain operations — we should plan to integrate these progressively.

Recommended next steps
----------------------
1. Standardize wallet generation:
   - Replace WalletsPage local generation with `WalletProtocol.generateWallet` or call `PayService.generateWallet` if cloud-backed generation is desired. Prefer `one-protocol` SDK for local, deterministic generation unless user opts for server-backed wallets.
2. Keep keys local by default; add an *explicit, secure* cloud backup option using pay.one (opt-in + E2E encryption if we accept mnemonics).
3. Connect token deployment & management (TokensPage) to pay.one token deployment APIs or one-protocol tooling instead of local mock data.
4. Migrate transactions & payments to use PaymentStatusTracker -> pay.one webhooks or API polling (remove sample tx generation where appropriate).
5. Consider syncing PeoplePage contacts to pay.one `person_*` endpoints as opt-in backup, using one-protocol schema for validation.
6. Update UDashboard & WalletsPage to share common Wallet API (adapter to choose one-protocol local vs pay.one cloud) for a consistent UX.

If you'd like I can now:
- Create a one-line PR scaffolding `web/src/lib/PayService.ts` (if it doesn't already exist) or normalize `WalletProtocol` usage across wallet pages.
- Implement replacing WalletsPage's local generation with a call to `WalletProtocol.generateWallet` and add migration UI to preserve existing local wallets.

---

File generated by automated scan on 2025-12-07.