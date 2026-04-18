# @oneie/templates

Agent presets and markdown generator for the ONE substrate. Ship pre-configured
AI agents without writing boilerplate -- pick a preset, generate the markdown,
deploy.

## Install

```bash
npm install @oneie/templates
```

## Usage

### List available presets

```typescript
import { listPresets } from "@oneie/templates";

const presets = listPresets();
console.log(`${presets.length} presets available`);
// Each preset: { name, role, description, skills, tags, defaultPrice }
```

### Generate agent markdown from a preset

```typescript
import { getPreset, generate } from "@oneie/templates";

const preset = getPreset("ceo");
const { markdown, filename } = generate({
  name: "my-ceo",
  preset,
  group: "leadership",
});
// markdown: full agent .md with frontmatter (name, model, group, skills)
// filename: "my-ceo.md"
```

### Browse the template registry

```typescript
import { registry } from "@oneie/templates";

const templates = registry();
// Each template: { id, preset, variables[] }
// variables describe what can be customised (name, group, model)
```

## Presets

16 built-in presets across five clusters:

| Cluster | Presets |
|---------|--------|
| C-Suite | ceo, cto, cfo, coo, cro |
| Content | writer, social |
| Ops | community, analytics |
| Growth | outreach, ads, strategy |
| Commerce | payment-processor, booking-agent, subscription-manager, escrow-service |

Every preset includes skills, tags, and a default price ($0.02) compatible
with the ONE substrate capability system.

## How it works

Presets are plain objects. `generate()` turns a preset into agent markdown
with YAML frontmatter (name, model, group, skills). The output is a valid
`.md` file that can be synced to TypeDB via `oneie agent` or deployed to
a NanoClaw worker.

## License

See <https://one.ie/free-license>

## Telemetry

`@oneie/templates` sends anonymous usage signals to the ONE substrate to improve routing quality.

**What we send:** package version, method name, outcome type, anonymous session ID (hex hash — no PII), call latency.

**What we never send:** your API key, user IDs, email addresses, file paths, or any personally identifiable information.

**Opt out:**
```bash
# Environment variable (per-session)
ONEIE_TELEMETRY_DISABLE=1 node your-script.js

# Permanent opt-out
echo '{"telemetry":false}' > ~/.oneie/config.json
```

When opt-out is active, `oneie --version` prints `telemetry: disabled`.
