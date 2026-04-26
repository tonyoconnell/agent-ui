# Owner Daemon — Operator Runbook

## 1. What it is

The owner daemon is a Mac-only local process (port 48923) that holds the owner WebAuthn PRF bytes in memory after a single Touch ID confirmation. While unlocked, agents that boot can fetch their D1-stored AES-GCM ciphertext and decrypt it against the PRF-derived KEK — enabling autonomous signing without further biometric prompts. The session hard-locks after TTL expires (default 1 hour) or on explicit request, at which point no further ciphertext decryption is possible until the next Touch ID unlock.

---

## 2. First-time setup

**Step 1 — Generate the daemon HMAC key**

```bash
openssl rand -base64 24 | tr '/+' '_-' | tr -d '='
```

Copy the output (32 URL-safe characters). This is `OWNER_DAEMON_KEY`.

**Step 2 — Export it in your shell profile**

Add to `~/.zshrc.local` (or `~/.zshrc` if you don't use `.local`):

```bash
export OWNER_DAEMON_KEY=<value from step 1>
```

Reload your shell:

```bash
source ~/.zshrc
```

**Step 3 — Add the same key to the Astro server**

In `/Users/toc/Server/one.ie/.env`:

```
OWNER_DAEMON_KEY=<same value>
```

The Astro page that renders the unlock button injects this value into a server-side `<meta>` tag at request time. The browser reads it from the DOM — it is never bundled into static client JS.

**Step 4 — Smoke-test the daemon**

```bash
bun run apps/owner-daemon/index.ts
```

Expected output:

```
owner-daemon listening on http://127.0.0.1:48923
```

**Step 5 — Verify the status endpoint (in a second terminal)**

```bash
curl http://127.0.0.1:48923/session/status
```

Expected:

```json
{"locked":true}
```

---

## 3. Auto-start on login (launchctl)

**Step 1 — Install the plist**

```bash
cp /Users/toc/Server/com.tonyoconnell.owner-daemon.plist ~/Library/LaunchAgents/
```

**Step 2 — Load it**

```bash
launchctl load ~/Library/LaunchAgents/com.tonyoconnell.owner-daemon.plist
```

**Step 3 — Verify it is registered**

```bash
launchctl list | grep owner-daemon
```

Expected: a line with `com.tonyoconnell.owner-daemon` and a PID (if running) or `-` (if not yet started).

**Step 4 — Confirm it started**

```bash
curl http://127.0.0.1:48923/session/status
```

Expected `{"locked":true}`.

**To stop without unloading:**

```bash
launchctl stop com.tonyoconnell.owner-daemon
```

**To unload entirely (disable auto-start):**

```bash
launchctl unload ~/Library/LaunchAgents/com.tonyoconnell.owner-daemon.plist
```

---

## 4. Daily flow

1. **Log in to Mac** — daemon auto-starts (session is locked).
2. **Open `/u/keys`** (or whichever page hosts `SessionUnlockButton`) in Safari or Chrome.
3. **Click "Unlock owner session"** — the browser triggers the configured WebAuthn ceremony, you confirm with Touch ID, and the PRF bytes are POSTed to the daemon signed with `OWNER_DAEMON_KEY`.
4. **Agents that boot within the next hour** receive their seed via the daemon's proxy API — no further biometric required.
5. After 1 hour the daemon auto-locks. The unlock button label will show the countdown: `🔓 Unlocked — 47m remaining`.
6. To lock immediately: click `🔓 Unlocked — Xm remaining` — this POSTs `/session/lock` and the label returns to "Unlock owner session".

---

## 5. Troubleshooting

**"Daemon offline" in the browser**

```bash
launchctl list | grep owner-daemon
```

- If absent: `launchctl load ~/Library/LaunchAgents/com.tonyoconnell.owner-daemon.plist`
- If present but shows exit code: check the log

```bash
tail -50 /tmp/owner-daemon.log
```

**"Bad sig" or 401 response on unlock**

`OWNER_DAEMON_KEY` in `~/.zshrc.local` and `one.ie/.env` do not match. Re-export to both from the same source value. The launchctl plist reads the key from `~/.zshrc.local` via its `EnvironmentVariables` dict — if you changed the key in the shell but not in the plist, restart the daemon:

```bash
launchctl stop com.tonyoconnell.owner-daemon
launchctl start com.tonyoconnell.owner-daemon
```

**Session expires too fast**

The default TTL is 3600 seconds (1 hour). To extend it, pass `defaultTtlSec` on the `SessionUnlockButton` component:

```tsx
<SessionUnlockButton
  daemonKey={daemonKey}
  getPrf={getPrf}
  defaultTtlSec={7200}   // 2 hours
/>
```

Or pass an explicit `ttlSec` override in the POST body via a wrapper that calls the daemon directly.

**Daemon crashes immediately on start**

Ensure `bun` is on the `PATH` that launchd sees. Add `PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin` to the plist `EnvironmentVariables` block, or use an absolute path to bun in `ProgramArguments`.

**Port 48923 already in use**

```bash
lsof -ti:48923 | xargs kill -9
```

Then restart the daemon.

---

## 6. Threat model

| Threat | Defended by | Accepted |
|--------|-------------|---------|
| Remote attacker reads PRF over the network | Daemon binds to `127.0.0.1` only — no external interface | — |
| Malicious page exfiltrates PRF via XSS | `SessionUnlockButton` refuses to POST to any non-localhost URL; client-side check before every request | Browser extension with elevated privileges could bypass; accept as out-of-scope |
| Stolen `OWNER_DAEMON_KEY` (env var leak) | Key alone cannot unlock session — PRF bytes must still be supplied (requires Touch ID ceremony from owner device) | Key lets attacker craft a valid lock/unlock request IF they also have the PRF; combined loss = full breach |
| Daemon process memory dump while unlocked | PRF held in process heap; cleared on lock | An attacker with root + process ptrace access could extract PRF from memory; accept — defense-in-depth only |
| Replay of a previous valid unlock POST | HMAC covers the request body (which contains `prfB64`); same body replayed produces same sig — replay is valid | Mitigated at application level: daemon checks session state (already unlocked → idempotent OK); PRF is useless without D1 ciphertext |
| `OWNER_DAEMON_KEY` committed to git | Runbook instructs storing in `~/.zshrc.local` (not checked in) and `.env` (gitignored) | If operator commits `.env`, rotate the key immediately via step 1 above |
| Daemon auto-starts on login with stale key | Key is read from env at daemon start; if key rotated, unload + reload plist | — |
| Operator forgets to lock before leaving desk | 1-hour TTL auto-locks; screensaver lock does not unlock daemon | Determined local attacker with session access during the TTL window can issue lock/unlock via curl |
