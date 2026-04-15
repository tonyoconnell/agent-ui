# /start - Quick Server Start

## Instructions for Claude

When user types `/start`, quickly start the development server and open the /start page.

**This is a simplified command that:**
1. Checks if server is running → if yes, just open /start page
2. If not running, check if installed → if not, install
3. Start the server
4. Open /start page in browser

---

## Workflow

### Step 1: Check if Running

```bash
lsof -ti:4321 2>/dev/null
```

**If running (PID returned):**
- Skip to Step 5 (just open /start page)

**If not running:**
- Continue to Step 2

---

### Step 2: Detect Working Directory

```bash
pwd | grep -q '/web$' && echo "IN_WEB" || echo "IN_ROOT"
```

---

### Step 3: Check Dependencies & Install if Needed

**If IN_ROOT:**
```bash
[ -d web/node_modules ] && echo "installed" || echo "missing"
```

**If IN_WEB:**
```bash
[ -d node_modules ] && echo "installed" || echo "missing"
```

**If missing, show progress and install:**

```
📦 Installing dependencies...
```

**If IN_ROOT:**
```bash
cd web && bun install
```

**If IN_WEB:**
```bash
bun install
```

---

### Step 4: Start Server in Background

**If IN_ROOT:**
```bash
cd web && bun run dev > /dev/null 2>&1 &
```

**If IN_WEB:**
```bash
bun run dev > /dev/null 2>&1 &
```

**Wait for server to start:**
```bash
sleep 3 && lsof -ti:4321 2>/dev/null
```

---

### Step 5: Open /start Page

```bash
open http://localhost:4321/start 2>/dev/null || xdg-open http://localhost:4321/start 2>/dev/null || start http://localhost:4321/start 2>/dev/null
```

---

### Final Output

**If server was already running:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server Already Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: http://localhost:4321/start
PID: [process-id]

Opening /start page in browser...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to ONE Platform!

Build production-ready features in minutes, not hours.

Get started with proven templates:
• "I want to sell coffee mugs"
• "Create a landing page for my course"
• "Build a product page for my service"

I'll guide you through every step - no technical knowledge needed.

Ready to build something amazing?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If server was started:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: http://localhost:4321/start
PID: [process-id]

Opening /start page in browser...

The server is running in the background.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to ONE Platform!

Build production-ready features in minutes, not hours.

Get started with proven templates:
• "I want to sell coffee mugs"
• "Create a landing page for my course"
• "Build a product page for my service"

I'll guide you through every step - no technical knowledge needed.

Ready to build something amazing?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If dependencies were installed:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dependencies installed: ✅
URL: http://localhost:4321/start
PID: [process-id]

Opening /start page in browser...

The server is running in the background.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to ONE Platform!

Build production-ready features in minutes, not hours.

Get started with proven templates:
• "I want to sell coffee mugs"
• "Create a landing page for my course"
• "Build a product page for my service"

I'll guide you through every step - no technical knowledge needed.

Ready to build something amazing?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If failed:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Failed to Start Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Try:
• Check if bun is installed: bun --version
• Install dependencies: bun install
• Start manually: bun run dev
• Check for port conflicts: lsof -ti:4321

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Key Principles

1. **FAST** - No unnecessary steps, get server running ASAP
2. **SMART** - Detect directory, install only if needed
3. **SILENT** - Run server in background
4. **HELPFUL** - Always open /start page when done
5. **RELIABLE** - Check status before/after actions

---

## Related Commands

- `/one` - Full ONE Platform control center with server management
- `/server start` - Detailed server start with full output
- `/server stop` - Stop the server
- `/server restart` - Restart the server
- `/server status` - Check server status
