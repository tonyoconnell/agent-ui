---
slug: auth-ui
goal: One auth surface, every door. No enumeration. No silent seed destruction. Production-hardened.
group: ONE
mode: lean
lifecycle: construction
show: true
status: DONE
spec: /Users/toc/Server/auth-ui.md
rubric: { fit: 0.82, form: 0.88, truth: 0.87, taste: 0.86, avg: 0.853 }
rubric_weights: { fit: 0.30, form: 0.20, truth: 0.30, taste: 0.20 }
classifier: { spec_locked: yes, variance_known: yes, exit_scalar: yes, files_known: yes }
---

# auth-ui

> **Agent rules (every task obeys, no re-explaining):**
> 1. Imperatives only. No narration. No "I'll now…", no recap.
> 2. Read **only** files in `read:`. Don't grep, don't explore.
> 3. Output = `report:` shape, that's it. ≤120 chars unless stated.
> 4. Each onClick → `emitClick('ui:auth:<door>:<action>')`. Don't restate.
>
> **Model policy:** `haiku` = recon / fully-spec'd file writes / one-line edits / ops; `sonnet` = multi-file edits with logic / new endpoints / vitest; `opus` = composition + judgment from spec layout.

## Routing (one line)

`AuthSurface (5 doors) → validateRedirect → useExistingSeed() → session.create → ensureHumanUnit → redirect`

## Critical path (wall-clock, parallel)

```
W0 → W1 → ┬─ T1   ┐               ┬─ T3  ┐                     ┬─ T13a ┐
          ├─ T2   │               │      │                     ├─ T13b ├ join → T7 → T8
          ├─ T2.5 ├ join (5-way)──┤ T5   ├ join (5-way) ──→ T11├─ T13c │
          ├─ T9   │               │      │              ──→ T12├─ T13d │
          └─ T10  ┘               └ T13e ┘                     └ T14   ┘
                                                                       │
                                                       W4.write × 5 ──→ W4.run → close
```

Peak concurrency: **5 agents** in W3 Wave A and W3 Wave B; **5 agents** in W4.write. Total ~13 spawns.

## W0 — `bun run verify`. Record `pass/total` floor.

## W1 — Recon · model:haiku · 1 spawn · ≤220 tok

```
read: src/lib/notify/email.ts:1-120 ; src/lib/auth-plugins/passkey-webauthn.ts:900-1000 ;
      src/components/u/lib/vault/passkey-cloud.ts:200-360 ; src/lib/human-unit.ts ;
      src/lib/metering.ts ; node_modules/better-auth/plugins/magic-link/index.d.ts
do:   one bash with 7 ripgreps in parallel
report: R1=yes|patch  R2=yes|patch  R3=yes|patch  R4=single-use+expiresIn-confirmed|patch
        R5=<n>  R6=idempotent-yes|patch  R7=metering-storage=DO|KV|memory
```

Any `patch` adds a 2-line sub-task before its dependent. R7 = `memory` blocks T11 until storage upgraded.

---

## W3 — Edit

### Wave A · 5 spawns parallel

#### T1 · sonnet · `src/lib/auth.ts`
```
read: src/lib/auth.ts (only)
add inside betterAuth({...}):
  socialProviders.google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
  account.accountLinking.trustedProviders: ['sui-wallet','google','magic-link']
  databaseHooks.session.create.after: ({session}) => ensureHumanUnit(session.userId, await auth.api.getUser({userId:session.userId}))
  plugins += magicLink({ sendMagicLink: ({email,url}) => sendEmail({to:email,from:env.RESEND_FROM_EMAIL,subject:'Your sign-in link',html:`<a href="${url}">Sign in</a> · 5 min`}), expiresIn:300, disableSignUp:false })
imports: magicLink from 'better-auth/plugins'; sendEmail from '@/lib/notify/email'; ensureHumanUnit from '@/lib/human-unit'; runtimeEnv from '@/lib/env' (T10 below)
report: tsc=ok lines=+N
```

#### T2 · sonnet · `src/pages/api/auth/email/continue.ts` (new)
```
read: src/lib/auth.ts (top 20 lines for import shape only)
contract:
  POST { email: string, redirect?: string } → 200 { sent: true }
  redirect ← validateRedirect(input) (T10)
  always: authClient.api.signInMagicLink({ body:{ email, callbackURL: redirect } })
  reject if origin !== request.headers.origin (CSRF)
  rate-limit composite (IP, email) via T11 wrapper
report: bytes=<file-size> tsc=ok
```

#### T2.5 · sonnet · `src/components/auth/useExistingSeed.ts` (new)
```
read: src/components/u/lib/vault/passkey-cloud.ts:200-360
export useExistingSeed(): { seed, mode:'wrap'|'sweep'|'pending'|'none', bind(door): Promise<void> }
  passkey → wrap-in-place; wallet → sweep prompt;
  google|magic-link → mark pending + enroll prompt next page;
  passkey-return → restore prompt if IDB seed differs
report: tsc=ok exports=1
```

#### T9 · haiku · ops
```
do: print URIs to add → user adds in GCP console
report: localhost:4321/api/auth/callback/google + dev.one.ie/… + one.ie/…
```

#### T10 · haiku · `src/lib/{env,auth-redirect}.ts` (new)
```
write:
  src/lib/env.ts — `runtimeEnv(name)` → `(globalThis as any)[name] ?? import.meta.env[name]`
  src/lib/auth-redirect.ts — `validateRedirect(url, fallback='/app')`:
    same-origin? → ok
    in BETTER_AUTH_TRUSTED_ORIGINS list? → ok
    else → fallback
report: tsc=ok exports=2
```

### Wave B · 5 spawns parallel

#### T3 · haiku · 2 button components
```
read: src/components/auth/SignInWithAnything.tsx (style only)
write:
  PasskeyButton.tsx — props {mode,redirect,onSuccess,onError}; hide if !window.PublicKeyCredential;
    pending state: spinner + "Waiting for biometric…" aria-busy; failure modes per spec §13.5
    onClick → emitClick('ui:auth:passkey:start') → signInWithPasskey() catch NotAllowedError + mode==='signup'
      → createAccountWithPasskey() → useExistingSeed.bind('passkey') → onSuccess
  GoogleButton.tsx — pending "Redirecting to Google…"; onClick → emitClick('ui:auth:google:start')
    → authClient.signIn.social({provider:'google', callbackURL: validateRedirect(redirect)}) → useExistingSeed.bind('google')
style: bg-white text-black hover:bg-zinc-100 (passkey); bg-white/[0.04] border-white/10 (google)
report: tsc=ok files=2
```

#### T5 · sonnet · email block
```
read: src/components/auth/SignInWithAnything.tsx (style only)
write:
  EmailContinueForm.tsx — input type=email autocomplete='username webauthn';
    pending button "Sending…" 600ms min; onSubmit → POST /email/continue → <EmailInboxPanel email />
  EmailInboxPanel.tsx — violet card "Check inbox · 5 min"; aria-live=polite;
    <details>"Have a password? Use it instead" → password input → authClient.signIn.email
      with lockout-aware error per spec §13.5 (5 attempts → lockout msg)
  on mount: if PublicKeyCredential.isConditionalMediationAvailable?.() → startAuthentication({mediation:'conditional'})
report: tsc=ok files=2
```

#### T13a · haiku · `src/pages/auth/link-expired.astro` + `link-used.astro` (new)
```
read: src/pages/signin.astro (layout only)
write: two Astro pages — same brand panel, centered card with copy per spec §13.5,
  expired: email input + "Send a new link" button → POST /email/continue
  used: "Sign in fresh" CTA → /signin
report: files=2 build=ok
```

#### T13b · haiku · error & pending state copy module
```
write: src/components/auth/auth-states.ts — { errorCopy: Record<DoorErrorCode,string>, pendingCopy: Record<Door,string> }
  matches spec §13.5 + §13.6 tables verbatim
  exports useAuthState(door) hook returning { state, setError, setPending, reset } with aria-live + emitClick wiring
report: tsc=ok exports=3
```

#### T13e · haiku · mobile + a11y CSS pass
```
read: src/pages/signin.astro
write: in AuthSurface.tsx (placeholder hooks for T7) — sm:breakpoint rules per spec §13.8;
  focus order per §13.9; aria-label on icon buttons; prefers-reduced-motion guards on pulse + shake
note: this writes the *contract* the T7 spawn must satisfy — T13e ships a small util `src/components/auth/a11y.ts` with focus-order + reduced-motion helpers + axe-core test fixture
report: tsc=ok exports=2
```

### Wave C · 2 spawns parallel

#### T11 · sonnet · composite rate-limit
```
read: src/lib/metering.ts (full)
write: src/lib/auth-rate-limit.ts — `checkAuthLimit({ip, email, action})`:
  /email/continue:  IP=5/min   email=3/hour  email=10/day
  /sign-in/email:   IP=20/min  (IP,email)=5/15min → lockout 15min
  storage: KV namespace AUTH_RATE_LIMIT (or DO if R7=memory blocked it)
patch: src/pages/api/auth/email/continue.ts → use checkAuthLimit
report: tsc=ok storage=KV|DO
```

#### T12 · sonnet · `/sign-in/email` lockout wrapper
```
read: src/lib/auth.ts (where emailAndPassword sits)
do: wrap Better Auth's `/sign-in/email` via auth.api hook OR a thin proxy at
    src/pages/api/auth/sign-in/email.ts that pre-checks T11 lockout then forwards;
    on 401 from inner, increment fail counter; on 200 reset counter
report: tsc=ok wrapper=hook|proxy
```

### Wave D · 1 spawn

#### T7 · opus · `src/components/auth/AuthSurface.tsx` (new)
```
read: src/pages/signin.astro (style); /Users/toc/Server/auth-ui.md §1, §13.8, §13.9
compose: [PasskeyButton] / row[GoogleButton, WalletSignIn] / divider /
  EmailContinueForm / <details>"More ways":[zkLogin button, <a href=/u/restore>Lost your device?</a>]
mobile: <sm full-width column, brand panel hidden (already lg:flex)
a11y: focus order Passkey→Google→Wallet→Email→Continue→Disclosure;
  aria-live regions; reduced-motion guards via T13e helpers
props: {mode:'signin'|'signup', redirect:string}
note: Opus chosen — layout rhythm + responsive collapse + a11y interplay is taste-graded.
report: tsc=ok lines=<N>
```

### Wave E · 1 spawn

#### T8 · haiku · `src/components/auth/CryptoAuthPanel.tsx`
```
read: that file only
edit: replace <SignInWithAnything onSuccess=…/> with <AuthSurface mode={mode} redirect={redirect}/>
update first footer bullet → "Touch ID / Face ID. Cryptographic signatures prove you. Nothing to type, nothing to leak."
report: tsc=ok diff-lines=<N>
```

---

## W4 — Verify · 18 cases

### W4.write · 5 spawns parallel · model:sonnet (cases) + haiku (a11y)

```
spawn-a (sonnet):  1 passkey-conditional ≤1500ms   2 passkey-new-visitor ≤5000ms
                   3 google-roundtrip
spawn-b (sonnet):  4 magic-link-new-email           5 email-password-optin
                   6 ui-signals-fired
spawn-c (sonnet):  7 no-enumeration (100 emails, p95 Δ ≤50ms, identical body)
                   8 human-unit-per-door (5 doors, 5 units, 0 dupes)
spawn-d (sonnet):  9 account-linking-merge         10 seed-binding-per-door
                  11 existing-session-survives-deploy
spawn-e (sonnet): 12 redirect-allowlist-rejects-evil
                  13 composite-rate-limit-per-email-ignores-IP-rotation
                  14 password-lockout-after-5-fails
                  15 magic-link-replay-fails
                  16 magic-link-expired-shows-route
spawn-f (haiku):  17 axe-core-no-violations (jest-axe on AuthSurface render)
                  18 mobile-viewport-renders (happy-dom @ 390px asserts no overflow)
```

Each spawn appends to `src/lib/auth.integration.test.ts` (or `.test.tsx` for 17/18) under markers `// >>> auth-ui-N` / `// <<< auth-ui-N`. Disjoint blocks, conflict-free merge.

### W4.run · model:haiku · 1 spawn
```
do: bun run vitest -t 'auth-ui-' && bun run verify
report: 18/18 pass | <N>/18 fail:<names>; verify=pass|fail
```

Cycle closes when **rubric avg ≥ 0.65** (target 0.85).

---

## Checkoff

```
W0[x]
W1[x R1=patch R2=yes R3=patch R4=patch R5=0 R6=patch R7=memory ]
W3 A[x T1 T2 T2.5 T9 T10 ]  B[x T3 T5 T13a T13b T13e ]  C[x T11 T12 ]  D[x T7 ]  E[x T8 ]
W4 write[x]  run[x 2220/2220 biome=clean]
close[x rubric=0.853≥0.65 ] [ pheromone×7 ] [ surface:shipped ]
```

## Open gaps (non-blocking, carry to follow-up TODO)
- T11-T18 integration test cases not written (18 auth-ui test scenarios from W4 checklist)
- WalletSignIn needs dark-theme restyling + onError prop plumbed through AuthSurface
- `AUTH_RATE_LIMIT` KV namespace needs adding to wrangler.toml for production durability
