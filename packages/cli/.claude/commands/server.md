# /server - Development Server Management

## Instructions for Claude

When user types `/server [action]`, manage the ONE Platform development server.

**CRITICAL:** For `/server start` and `/server restart`:
1. Check if web/node_modules exists
2. If missing, run `cd web && bun install` FIRST
3. Only then run `bun run dev`
4. This prevents "failed to start" errors from missing dependencies

### Supported Actions

- `/server` or `/server status` - Check server status
- `/server start` - Start development server
- `/server stop` - Stop development server
- `/server restart` - Restart development server

---

## Action: Status (Default)

Check if server is running on port 4321:

```bash
lsof -ti:4321 2>/dev/null
```

**If running (PID returned):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Dev Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: http://localhost:4321
PID: [process-id]

Commands:
• /server stop - Stop server
• /server restart - Restart server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If not running:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭕ Dev Server Not Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Start it with:
• /server start

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Action: Start

Start the development server if not already running.

### Step 1: Check if Already Running

```bash
lsof -ti:4321 2>/dev/null
```

If running, show:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Server Already Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: http://localhost:4321
PID: [process-id]

Use /server restart to restart it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Stop here and don't continue.

### Step 2: Check if Bun is Installed

**Check for bun:**
```bash
command -v bun >/dev/null 2>&1 && echo "installed" || echo "missing"
```

**If missing:**
```
📦 Installing Bun - the last npm command you'll ever need...
```

**Install bun globally:**
```bash
npm install -g bun
```

**If install succeeds:**
```
✅ Bun installed successfully!
```

### Step 3: Detect Working Directory

```bash
pwd | grep -q '/web$' && echo "IN_WEB" || echo "IN_ROOT"
```

### Step 4: Check Dependencies Installed

**If IN_ROOT:**
```bash
[ -d web/node_modules ] && echo "installed" || echo "missing"
```

**If IN_WEB:**
```bash
[ -d node_modules ] && echo "installed" || echo "missing"
```

### Step 5: Install Dependencies if Missing

**If missing, show progress:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Installing Dependencies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If IN_ROOT:**
```bash
cd web && bun install
```

**If IN_WEB:**
```bash
bun install
```

**If install fails, show error and STOP:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Failed to Install Dependencies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Try manually:
  bun install

Common issues:
• Bun not installed (curl -fsSL https://bun.sh/install | bash)
• package.json corrupted
• Network issues

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 6: Start Server in Background

**If IN_ROOT:**
```bash
cd web && bun run dev > /dev/null 2>&1 &
```

**If IN_WEB:**
```bash
bun run dev > /dev/null 2>&1 &
```

### Step 7: Wait and Verify (3 seconds)

```bash
sleep 3 && lsof -ti:4321 2>/dev/null
```

### Step 8: Open Start Page in Browser

```bash
open http://localhost:4321/start 2>/dev/null || xdg-open http://localhost:4321/start 2>/dev/null || start http://localhost:4321/start 2>/dev/null
```

**If started successfully:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Dev Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: http://localhost:4321/start
PID: [process-id]

Opening /start page in your browser...

The server is running in the background.

Commands:
• /server stop - Stop server
• /server restart - Restart server
• /server status - Check status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If failed to start:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Failed to Start Dev Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check for errors:
  bun run dev

Possible issues:
• Port 4321 in use (try: lsof -ti:4321 | xargs kill)
• Missing dependencies (run: bun install)
• Build errors (check TypeScript)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Action: Stop

Stop the development server if running.

### Step 1: Find Process

```bash
lsof -ti:4321 2>/dev/null
```

**If not running:**

```
⚠️  No server running on port 4321

Nothing to stop!
```

### Step 2: Kill Process

```bash
lsof -ti:4321 | xargs kill 2>/dev/null
```

### Step 3: Verify Stopped

```bash
sleep 1 && lsof -ti:4321 2>/dev/null || echo "stopped"
```

**If stopped successfully:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭕ Dev Server Stopped
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Start it again with:
• /server start

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If failed to stop:**

```
❌ Failed to stop server gracefully

Force kill with:
lsof -ti:4321 | xargs kill -9
```

---

## Action: Restart

Restart the development server (stop then start).

### Step 1: Stop Server

```bash
lsof -ti:4321 | xargs kill 2>/dev/null
sleep 1
```

### Step 2: Check if Bun is Installed

**Check for bun:**
```bash
command -v bun >/dev/null 2>&1 && echo "installed" || echo "missing"
```

**If missing:**
```
📦 Installing Bun - the last npm command you'll ever need...
```

**Install bun globally:**
```bash
npm install -g bun
```

**If install succeeds:**
```
✅ Bun installed successfully!
```

### Step 3: Detect Working Directory

```bash
pwd | grep -q '/web$' && echo "IN_WEB" || echo "IN_ROOT"
```

### Step 4: Check Dependencies Installed

**If IN_ROOT:**
```bash
[ -d web/node_modules ] && echo "installed" || echo "missing"
```

**If IN_WEB:**
```bash
[ -d node_modules ] && echo "installed" || echo "missing"
```

### Step 5: Install Dependencies if Missing

**If missing:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Installing Dependencies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If IN_ROOT:**
```bash
cd web && bun install
```

**If IN_WEB:**
```bash
bun install
```

### Step 6: Start Server

**If IN_ROOT:**
```bash
cd web && bun run dev > /dev/null 2>&1 &
```

**If IN_WEB:**
```bash
bun run dev > /dev/null 2>&1 &
```

### Step 7: Wait and Verify (3 seconds)

```bash
sleep 3 && lsof -ti:4321 2>/dev/null
```

### Step 8: Open Start Page in Browser

```bash
open http://localhost:4321/start 2>/dev/null || xdg-open http://localhost:4321/start 2>/dev/null || start http://localhost:4321/start 2>/dev/null
```

**If restarted successfully:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Dev Server Restarted!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: http://localhost:4321/start
PID: [process-id]

Fresh server instance running.
Opening /start page in your browser...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If restart failed:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Failed to Restart Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Try manually:
1. /server stop
2. /server start

Or check logs:
  bun run dev

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Backend Server (Convex)

If user mentions "backend server" or "convex dev":

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Backend Server (Convex)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The backend runs on Convex Cloud:
URL: https://shocking-falcon-870.convex.cloud

For local backend development:
cd backend && npx convex dev

For production deployment:
cd backend && npx convex deploy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Key Principles

1. **FAST** - Server starts in < 3 seconds
2. **BACKGROUND** - Run server in background, don't block user
3. **RELIABLE** - Always verify server status before/after actions
4. **CLEAR** - Show clear status and actionable commands
5. **SAFE** - Graceful shutdown, verify before killing processes
6. **HELPFUL** - Auto-open start page (http://localhost:4321/start) after successful start/restart

---

## Error Handling

**Port already in use:**

```
❌ Port 4321 is already in use

Kill the process:
lsof -ti:4321 | xargs kill

Or use a different port:
cd web && bun run dev -- --port 4322
```

**Missing dependencies:**

```
❌ Server failed to start - missing dependencies

Install dependencies:
cd web && bun install

Then try again:
/server start
```

**Build errors:**

```
❌ Server failed to start - build errors

Check for TypeScript errors:
cd web && bunx astro check

View detailed output:
cd web && bun run dev
```
