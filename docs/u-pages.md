# /u/* Page Reference

Page-by-page behaviour for the Universal Wallet surface. All pages are pre-rendered Astro shells with `client:only="react"` islands. No server-side data fetching — wallet state comes from IndexedDB (`one-wallet`, `one-vault`) or on-chain RPC.

---

## `/u` — Dashboard

**Component:** `UDashboardWithBoundary`

The entry point. No login required. On first visit a wallet is created automatically (Ed25519 keypair, stored in `one-wallet` IDB). Shows total balance across all chains, the primary wallet card, and quick-action buttons (Send, Receive, Swap).

An unsaved wallet (State 1) shows a "Save with Touch ID" banner and limits receive to $25. State 2+ (passkey-enrolled) has no cap.

**Data:** `one-wallet` IDB for balances; on-chain RPC for live prices.

---

## `/u/send` — Send Crypto

**Component:** `SendPage`

Step-by-step send flow. Paste a destination address or pick from contacts. Select network and token. Enter amount (shown in crypto and USD). Confirm and sign. Supports sending between your own wallets. On Sui, uses the passkey-backed signer from the vault.

**Data:** `one-wallet` IDB; on-chain RPC for balances and gas estimates.

---

## `/u/fleet` — Agent Fleet

**Component:** `FleetIsland`

Shows the transitive tree of ScopedWallets rooted in the user's Sui address. A ScopedWallet is an agent wallet with a daily spending cap. The fleet view shows total exposure (sum of all daily caps).

**Key interactions:** View per-agent cap. Revoke a scoped wallet (removes it from the on-chain tree). Add a new agent wallet with a cap.

**Data:** `GET /api/u/fleet?address=<suiAddress>` (TypeDB + on-chain). Address is read from `one-vault` IDB on mount.

---

## `/u/approve` — Co-sign Approval

**Component:** `ApproveIsland`

Shows a pending agent transaction request for human co-sign. The summary is re-derived from raw `txBytes` — if the derived summary does not match what the agent described, the UI warns and blocks approval.

**Query params:** `?id=<requestId>` — specific request. Omit to load the first pending request.

**Key interactions:** Review the derived summary. Tap **Approve** to co-sign and broadcast. Tap **Reject** to deny.

**Data:** TypeDB (pending co-sign requests) + on-chain (`txBytes` derivation).

---

## `/u/save` — Save Prompt

**Component:** `SavePromptIsland`

One-tap passkey enrollment. Shown after a first transaction or navigated to directly. Not shown again once the wallet is in State 2. See `docs/save-restore-devices-ux.md` for the full flow.

---

## `/u/restore` — BIP39 Restore

**Component:** `RestoreIsland`

Break-glass recovery. Enter 12 BIP39 words to recover a wallet on any device. This is the only page that accepts a seed phrase. See `docs/save-restore-devices-ux.md`.

**Data:** Pure client-side derivation. No server call.

---

## `/u/devices` — Enrolled Devices

**Component:** `DevicesIsland`

Lists enrolled passkey credentials. Revoke individual devices. See `docs/save-restore-devices-ux.md`.

**Data:** `one-vault` IDB (wrappings array).

---

## All pages — reference table

| URL | Component | What it does | Data |
|---|---|---|---|
| `/u` | `UDashboardWithBoundary` | Wallet dashboard, $25 cap for State 1 | IDB + RPC |
| `/u/sign` | `SignPage` | Alternate home, State-1 save banner | IDB (vault) |
| `/u/wallets` | `WalletsPage` | All wallets, generate/import/export | IDB |
| `/u/send` | `SendPage` | Send crypto, contact picker | IDB + RPC |
| `/u/tokens` | `TokensPage` | Deploy ERC-20 / SPL / Move tokens | IDB + on-chain |
| `/u/transactions` | `TransactionsPage` | Tx history, filter, CSV export | On-chain RPC |
| `/u/swap` | `SwapPage` | Cross-chain token swaps | On-chain RPC |
| `/u/contracts` | `ContractsPage` | Deploy + interact with contracts | IDB + on-chain |
| `/u/keys` | `KeysPage` | View/export keys (biometric-gated) | IDB (vault) |
| `/u/people` | `PeoplePage` | Address book, used in Send | IDB |
| `/u/products` | `ProductsPage` | List products, crypto payment links | IDB + pay.one.ie |
| `/u/save` | `SavePromptIsland` | Passkey enrollment (State 1 → 2) | IDB (vault) |
| `/u/restore` | `RestoreIsland` | BIP39 12-word recovery | Client-only |
| `/u/devices` | `DevicesIsland` | Enrolled passkeys, revoke | IDB (vault) |
| `/u/fleet` | `FleetIsland` | Agent spending tree, caps | TypeDB + on-chain |
| `/u/approve` | `ApproveIsland` | Human co-sign for agent tx | TypeDB + on-chain |
| `/u/testnet-tokens` | `TestnetTokensPage` | Faucet links per network | Static |
| `/u/[name]` | `UserProfile` | Public wallet/profile view | TypeDB + on-chain |
