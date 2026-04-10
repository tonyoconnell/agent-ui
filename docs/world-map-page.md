# World Map Page

The build spec for `/world` — the page where you can **see the world, touch
it, and change it.** Every unit, every path, every signal in ONE shows up
here. Click anything to understand it. Drag anything to move it. Edit
anything to change it. Watch the world react.

`world-map.md` is the territory (six layers, seven loops, sundial). This
file is the **practical wiring**: what the page renders, what vocabulary it
uses, what a user can touch, and what happens when they do.

> One Astro page. One canvas. Live. Editable. Simple enough for a child.
> Honest enough for a CEO.

---

## Two Audiences, One Page

If we get this right, the same canvas works for both ends of the spectrum.
If we don't, the page is a dashboard for nobody.

```
A CHILD walks up to the screen.                A CEO walks up to the screen.

They see ants moving along trails.             They see teams handling work.
They drag an ant to a new spot.                They drag a person between teams.
They draw a line between two ants.             They connect two roles.
They watch the line glow as ants use it.       They watch the workflow strengthen.
They click an ant and rename it "Bob".         They click a role and rename it.
They drop a sticker on Bob.                    They edit Bob's job description.
They press space — the world fast-forwards.    They scrub time to last week.
They laugh when a trail goes red and fades.    They notice the workflow is failing.

   Same canvas. Same gestures. Same data.
   Only the labels and the stakes are different.
```

The labels are controlled by **skin** (`?skin=ant` for the child,
`?skin=team` for the CEO). The gestures are universal. The data is the
same `unit`s and `path`s underneath.

Design rule: **if a child cannot figure out a control by poking it, the
control is wrong.** The CEO will appreciate the same simplicity — they
just won't admit it.

---

## The Dictionary On Screen

Every visible thing on `/world` is a word from `docs/dictionary.md`. No new
nouns. No invented verbs. The page is the dictionary made visual.

| Dictionary word | What you see                                   | What you can do            |
| --------------- | ---------------------------------------------- | -------------------------- |
| **signal**      | A glowing dot moving from one unit to another  | Click to inspect, replay   |
| **unit**        | A circle on the canvas (with a face/icon)      | Drag, rename, edit, delete |
| **task**        | A small chip on a unit (`scout:observe`)       | Click to run, edit, price  |
| **path**        | A line between two units                       | Draw, drag, weight, cut    |
| **strength**    | Line thickness and brightness                  | Drag a slider on the path  |
| **resistance**  | Line darkness, dashed when toxic               | Drag a slider on the path  |
| **highway**     | A thick gold line, glowing                     | Click to see why it works  |
| **toxic**       | A grey, dashed, fading line                    | Click to see what failed   |
| **fade**        | Lines slowly thinning when nothing flows       | Watch, or press `>>` to speed up |
| **follow**      | A pulse along the strongest path               | Click "follow" on a unit   |
| **mark**        | A small `+` flash on a path after success      | Tap a path to mark it `+1` |
| **warn**        | A small `!` flash on a path after failure      | Tap a path to warn it `-1` |
| **world**       | The whole canvas                               | Pan, zoom, save, share     |
| **group**       | A coloured hull around a set of units          | Drag units in/out          |
| **knowledge**   | A constellation of highways in the corner      | Click to read the lesson   |

If a user sees something on the page they cannot find in this table, the
page has invented vocabulary and the page is wrong.

---

## What The Page Shows

Four things, every time, in one view:

```
1. UNITS        who's in the world (agents, humans, sensors)
2. PATHS        how they connect (with strength and resistance)
3. SIGNALS      what's flowing right now (live particles)
4. KNOWLEDGE    what's been learned (highways and lessons)
```

That's it. Groups are how units cluster. Tasks are what units do. Events
are signals that already happened. Everything else is one of these four.

---

## Personas — Who This Page Is For

`/world` is the **first thing every persona sees** after signing in. It must
resonate with their mental model in under five seconds. The personas are
defined in `docs/one-strategy.md` § Target Personas; each has a markdown
agent already in `agents/`. The page ships a one-click **persona view** that
preselects the right group, lens, and skin so the user lands on a layout
that already makes sense.

| Persona              | Lands on              | Lens     | Skin   | First thing they see                                     |
| -------------------- | --------------------- | -------- | ------ | -------------------------------------------------------- |
| **Anne** (EHC)       | `group=ehc.framework` | `org`    | `team` | Her 6 agents as an org chart, today's plans in flight    |
| **Eth Developer**    | `focus=eth-dev`       | `money`  | `team` | Their highway = portfolio, gold veins = audits paid      |
| **ASI Builder**      | `group=asi`           | `colony` | `ant`  | uAgents bridging ONE↔AgentVerse, cross-world signals     |
| **Startup Founder**  | `group=<their-org>`   | `org`    | `team` | Marketing + Eng + Sales departments, $/day burn          |
| **DeFi Trader**      | `focus=trader`        | `colony` | `signal` | Chain scanners as receivers, alert frequencies live    |
| **Community Builder**| `group=community`     | `colony` | `ant`  | Members as ants, emergent clusters glowing               |
| **Designer**         | `focus=designer`      | `skills` | `team` | Their skill catalog, who hired them, ratings             |
| **DevOps**           | `lens=health`         | n/a      | `signal` | Worker health, queue depth, recent incidents           |
| **Code Helper**      | `focus=coder`         | `colony` | `brain` | Recent reviews as synapses firing                        |
| **Content Writer**   | `focus=writer`        | `colony` | `team` | Pipeline with creative + content + social               |

The persona switcher is a small dropdown in the top-right of the health
strip: `[Anne ▾]`. Picking a persona writes the URL params and reloads the
view — every persona view is a **shareable link**.

```
/world?persona=anne   →  ?group=ehc.framework&lens=org&skin=team&focus=ehc-officer
/world?persona=eth    →  ?focus=eth-dev&lens=money&skin=team
```

Personas are not roles or permissions — they are **starting positions**. A
user can pan, switch lens, and explore from there.

---

## Direct Manipulation — See It, Touch It, Change It

The single most important rule of `/world`: **anything you can see, you
can change with your hands.** No "edit mode". No modal dialog. No form. If
you click a name, it becomes a text box. If you drag a slider on a path,
the path's strength changes live. If you draw a line between two units, a
path is born.

This is what makes the page feel like a game to a child and a control room
to a CEO. Both want the same thing: **direct contact with the world.**

### The Gestures

```
DRAG a unit                  → it moves; position saved to its profile
RENAME a unit                → click the name, type, press enter
ROUND-TRIP a unit            → drag from sidebar onto canvas to add
DELETE a unit                → drag to the trash hole, or press ⌫
DRAW a path                  → click + drag from one unit to another
CUT a path                   → click the path, press ⌫ (it fades fast)
WEIGHT a path                → drag the strength slider on its hover card
WARN a path                  → tap the small ! button on its hover card
MARK a path                  → tap the small + button on its hover card
EDIT a prompt                → click the prompt in the agent card, type
PRICE a task                 → click the price chip on a task, type
RUN a task                   → click ▶ on a task chip; signal flies
GROUP some units             → lasso them, press G, name the group
PAN / ZOOM                   → drag empty space / scroll
SCRUB time                   → drag the bottom timeline
FAST FORWARD                 → press > to make fade run faster
PAUSE                        → press space; the world holds still
```

### Edits Are Signals

Every edit on the page **is itself a signal** in the substrate. Renaming a
unit emits `{ receiver: 'world:rename', data: { id, name } }`. Drawing a
path emits `{ receiver: 'world:link', data: { from, to } }`. Sliding a
strength bar emits a series of `mark` or `warn` calls. The world doesn't
have a separate "edit API" — there's only one API, `signal`, and the page
uses it.

This means:

- **Undo is automatic** — every edit is a logged signal, so it can be replayed in reverse.
- **Multiplayer is free** — two people editing the same canvas just see each other's signals.
- **Audit trail is built in** — TypeDB already stores every signal.
- **Edits show up in activity** — your own rename appears in the ticker like everything else.

### Visualising The Change

The hardest part of "edit anything" is making the consequence **visible
within 200ms**. The rules:

```
You DRAG a unit                → its hull recolours instantly, paths re-route
You RENAME a unit              → the new name appears everywhere it's referenced
You DRAW a path                → the line appears at strength 1, dim, slowly grows
You WEIGHT a path UP           → the line thickens and brightens immediately
You WEIGHT a path DOWN         → the line thins; if it crosses toxic, it goes grey-dashed
You CUT a path                 → it doesn't vanish — it fades over 2 seconds, like real fade
You EDIT a prompt              → a faint pulse on the unit; new generation badge ticks up
You RUN a task                 → a particle flies from this unit to the next
You DELETE a unit              → it shrinks to nothing; trails remain (and fade naturally)
You GROUP units                → a hull animates around them, takes on the group colour
```

The rule of thumb: **the world reacts before the user finishes the gesture.**
Latency is the enemy of play.

### What You Cannot Edit (And Why)

Some things are read-only because they belong to the substrate, not the user:

```
- success-rate, sample-count, generation     ← computed by the substrate
- highway / toxic classification             ← derived from strength/resistance
- wallet address                              ← derived from SUI_SEED + uid
- past signals (in the timeline)              ← history is immutable
```

If a user tries to edit one of these, the page shows a tiny line of help
text: *"This is what the world learned. Change the inputs and watch it
update."* No error. No modal.

---

## What People Need to See

Cut every feature that doesn't help a person answer one of these eight
questions in under five seconds:

```
1. WHO IS HERE?              units, count, names, faces, groups
2. WHAT CAN THEY DO?         tasks, with prices
3. HOW DO THEY CONNECT?      paths, weighted by strength
4. WHAT'S MOVING NOW?        live signals as particles
5. WHAT'S WORKING?           highways, gold veins on revenue
6. WHAT'S BROKEN?            toxic paths, low success-rate units
7. WHAT'S NEW?               recent changes, ticker, generation bumps
8. WHAT IF I CHANGE THIS?    direct manipulation; instant feedback
```

A child cares most about 1, 3, 4, 8. A CEO cares most about 5, 6, 7, 8.
Both share 8 — the question that turns a dashboard into a tool.

---

## Visitor Mode — The First 30 Seconds

Most people landing on `/world` are **visitors**: not signed in, no agents
of their own, no context. They get 30 seconds before they bounce. The page
must answer one question in that window: *"Is this thing alive, and what
is it doing?"*

Visitor mode is automatic when there's no session. It locks the page to a
**curated public world** so the canvas is full of activity even with zero
private data exposed.

```
What a visitor sees in the first 30 seconds
─────────────────────────────────────────────

t=0s    Canvas loads with the public demo world.
        Skin = signal (neutral). Lens = colony.
        Health strip says: "847 agents · $4.12/min · 96% success"

t=2s    Particles start gliding. Ticker scrolls.
        Highways glow gold. Toxic edges grey out.

t=5s    A small banner slides in from the top:
          "This is the ONE world. It's alive right now.
           Click anything. Drag anything. Or [follow the guide]."

t=10s   If they hover an agent → its card opens, showing skills and prices.
        If they click an edge → its strength + recent signals appear.
        If they do nothing → a gentle "ghost cursor" demos one click.

t=20s   The ticker shows a real revenue event in green:
          "eth-dev → trader · audit · ✓ · +$0.45 · just now"
        That's the moment most people decide to sign up.

t=30s   Bottom bar offers: [follow the guide] [build your own ↗ /build] [see the kanban ↗ /tasks]
```

What visitor mode **disables**: editing, prompts, wallets, mutating
buttons, and any unit not flagged `public: true`. The page is read-only
for them — but it never feels static, because the substrate is real.

---

## Follow The Guide

Yes. A guided tour is the right thing for both audiences. For a child it's
the tutorial level. For a CEO it's the briefing. They need different paces
but the same script, so we ship one tour with adjustable speed.

The guide is a **sequence of signals replayed on the canvas**, with a tiny
narrator card in the corner. It is not a slideshow, not a tooltip tour.
You watch the world doing the thing while the narrator names it. Press →
to advance, ← to go back, esc to leave at any step.

```
Step  Narrator says                          Canvas does
────  ─────────────                          ───────────
1     "This is a unit."                      Highlights one agent. Pulses.
2     "It can do things. These are tasks."   Spreads its task chips outward.
3     "When it does work, it sends a         Fires a particle to a neighbour.
      signal to someone else."
4     "That leaves a trail. We call it       Path lights up between them.
      a path."                               Strength = 1.
5     "Do it again, and again, and the       Particles repeat. Strength climbs
      path gets stronger."                   visibly. Line thickens.
6     "When a path gets strong enough,       Line turns gold. Tag: HIGHWAY.
      we call it a highway."
7     "If it fails, the path gets a          Different pair fails. Path darkens.
      warning. It gets weaker."              Resistance climbs.
8     "Too many warnings, and it goes        Line greys out, dashes. Tag: TOXIC.
      toxic. The world stops using it."
9     "Nothing flows? It fades."             A third path slowly thins to nothing.
10    "Now you try. Drag this unit.          Ghost cursor demos drag.
      Draw a line to that one."              User takes over.
11    "You just changed the world. Watch     New path appears. First particle
      it react."                              flies along it. Strength = 1.
12    "That's it. The world is yours.        Tour ends. Banner: "You're in.
      Sign in to keep your changes."         [sign up] or [keep playing in sandbox]"
```

The whole tour is twelve steps and finishes in under two minutes at
default speed. A child clicks through it like a level. A CEO scrubs to
step 10 to see the moment of agency. Both arrive at the same place: they
*touched the world* and saw it react.

The guide reuses the same gestures the rest of the page uses — there is
no separate tutorial code path. The narrator just **scripts signals** into
the substrate's demo world, and the canvas does what it always does.

URL: `/world?guide=1` or `?guide=step-10` to jump straight in. The deep
link to step 10 is the most-shared link, because it's the one where you
get to play.

---

## The Whole Component Set

Strict count. If a component isn't in this list, it doesn't belong on the
page — it belongs on a sibling page that `/world` links to.

```
SHELL                            CANVAS                       OVERLAYS
─────                            ──────                       ────────
Layout.astro                     WorldGraph.tsx               HealthStrip
WorldWorkspace.tsx               (already exists)             ActivityTicker
                                                              AgentCard (right)
                                                              OrgTree (left)
                                                              LensSwitcher
                                                              SkinSwitcher
                                                              PersonaMenu
                                                              TimeScrubber
                                                              GuideNarrator
                                                              VisitorBanner
```

Twelve components. That's the entire surface area of `/world`. Anything
beyond this is feature creep and goes to a sibling page or gets deleted.

---

## The ONE Ontology Drives Everything

Every node, edge, and panel on the page is one of the six dimensions from
`docs/one-ontology.md`. Nothing else exists on this page.

| Dimension     | On the page                        | Source (TypeDB → KV)        |
| ------------- | ---------------------------------- | --------------------------- |
| **Groups**    | Org boxes, colony hulls, DAOs      | `/api/export/groups.json`   |
| **Actors**    | Agent pins (humans, LLMs, bots)    | `/api/export/units.json`    |
| **Things**    | Skills offered, prices, services   | `/api/export/skills.json`   |
| **Paths**     | Reporting lines, pheromone trails  | `/api/export/paths.json`    |
| **Events**    | Live signal particles, recent log  | `/api/export/signals.json`  |
| **Knowledge** | Highways, hypotheses, frontiers    | `/api/export/highways.json` |

If something doesn't fit one of these six, it doesn't belong on `/world`.

---

## Route

```
src/pages/world.astro          →  /world
  └─ <Layout title="ONE World">
       └─ <WorldWorkspace client:load />
```

The shell already exists. This doc describes what `WorldWorkspace` renders.

---

## Names Across Skins — One True Name, Many Costumes

A real problem: each skin uses different vocabulary for the *type*
(ant / neuron / agent / mailbox / pool / receiver), but every unit also
has an actual *name* (`creative`, `eth-dev`, `trader`). If we let each
skin invent its own names, we get six sets of strings to maintain, six
rename operations, and a drift problem nobody will fix.

So we don't.

### The rule

```
The unit's id is its true address. It never changes — ever.
The unit's NAME belongs to the user who owns it. They pick it. They change it.
The skin adds a glyph and a type label, not a new name.
Anyone viewing someone else's unit can give it a personal nickname.
A team that really wants per-skin aliases can opt in. Most won't.
```

Four layers of naming, each owned by a different party:

```
LAYER       OWNER             SCOPE             EDITABLE WHEN
─────       ─────             ─────             ─────────────
id          substrate         global, forever   never
name        unit's owner      everyone sees it  any time, by owner
alias[skin] unit's owner      per-skin display  any time, by owner
nickname    each viewer       only that viewer  any time, by viewer
```

### What renders, by layer

```
Layer            What it is              Per-skin?   Example (ant)        Example (team)
─────            ───────────             ─────────   ─────────────────    ─────────────────
id               primary key in substrate   no       marketing:creative   marketing:creative
canonical name   human-readable display     no       creative             creative
type label       what kind of thing it is   yes      ant                  agent
glyph            icon next to the name      yes      🐜                   👤
hull color       group container colour     yes      forest green         corporate blue
verbs in UI      "deposit", "alarm", etc    yes      mark/warn → drop/alarm  mark/warn → commend/flag
alias (opt-in)   custom name for this skin  yes      "scout-7" (if set)   (usually unset)
```

So in ant skin, the unit at `marketing:creative` shows as:

```
   🐜 creative
   ant · marketing colony
```

And in team skin, the same unit shows as:

```
   👤 creative
   agent · marketing team
```

Same name. Same id. Different costume.

### Users name their own agents

The most important thing the user does on `/world` is **make an agent
theirs**. The first thing they want to do after spawning one is name it.
Sparky. Bob. Helen. The Chief. The system must get out of the way.

There are two distinct cases, and they need different scopes:

```
CASE A — I own it. I name it. Everyone sees the name.
─────────────────────────────────────────────────────
I spawn an agent in my world. I drag it onto the canvas.
I click its name. I type "Sparky". Press enter.
That's now its canonical name. My teammates see "Sparky".
The dashboard says "Sparky". The kanban says "Sparky".
The id underneath stays unchanged (e.g. tony:scribe-7a3f).

CASE B — Someone else owns it. I want to call it something
        in my view. Nobody else sees it.
────────────────────────────────────────────────────
I'm browsing the public marketplace. I see an agent called
"creative" that I work with often. I right-click → "Nickname".
I type "Headline Hero". Press enter.
On my screen, every reference to that agent now reads
"Headline Hero". On everyone else's screen, it still says
"creative". The owner has not been notified. The substrate
is untouched. It's a personal label, like a contact nickname.
```

Case A is **canonical name editing** — gated by ownership, broadcast to
the world. Case B is **personal nickname** — local to one user, never
broadcast. They use the same gesture (click, type, enter), so the user
doesn't have to learn two patterns.

### When the user picks a name

Three moments, all using the same in-place gesture:

```
1. AT BIRTH       Drag a fresh agent onto the canvas.
                  The name field is pre-focused. Type it. Done.
                  Default if they skip: a friendly random name
                  ("Mossy Owl", "Quiet Brook") — never "agent-7341".

2. IN PLACE       Click the name on any unit you own.
                  It becomes a text box. Type. Enter.
                  The change propagates instantly to everyone.

3. ON FORK        You copy a public agent into your world.
                  The form asks: "What do you want to call your copy?"
                  Suggested name = the original. You can change it.
                  Your copy has a fresh id, your name, your wallet.
```

Renaming is an **edit-as-signal** like everything else on the page:

```typescript
{ receiver: 'world:rename',
  data: { id: 'tony:scribe-7a3f', name: 'Sparky', by: 'tony' } }
```

Anyone who already set a nickname for that unit keeps their nickname —
their personal label takes priority over the owner's canonical name.
That's the right behaviour: it matches how a contact's name change in
your phone never overrides a nickname you set.

### How display name resolves

```
displayName(unit, viewer, skin) =
       viewer.nicknames[unit.id]                ← if viewer set a personal nickname
    ?? unit.aliases?.[skin]                    ← if owner set a per-skin alias
    ?? unit.name                                ← the canonical name (owner-set)
    ?? unit.id                                  ← last resort, never seen in practice
```

One small function. Four layers. Resolves in microseconds. The id is
always available as a tooltip on hover, so power users can still find
the address underneath.

### Where each layer lives

```
LAYER       STORAGE                                  SHAPE
─────       ───────                                  ─────
id          substrate (TypeDB unit.uid)              "tony:scribe-7a3f"
name        substrate (TypeDB unit.name)             "Sparky"
alias[skin] substrate (TypeDB unit.alias-{skin})     "scout-7"
nickname    per-user KV (kv:nicknames:<userId>)      { "tony:scribe-7a3f": "Headline Hero" }
```

The nickname is the only piece that does **not** live in the substrate.
It's per-user preference, not shared truth. Storing it in KV keeps the
substrate clean and means a user can wipe their nicknames without
touching anyone else's data.

### Collisions are fine

Two users naming their agents "Sparky" is not a problem because the id
is unique (`tony:scribe-7a3f` vs `anne:writer-9c1e`). The display says
"Sparky" in both worlds. When they meet — say, in a shared group — the
page disambiguates by appending the owner: `Sparky (tony)` and
`Sparky (anne)`. Same trick Discord uses.

### Ownership and the rename button

Only the owner of a unit sees the editable name on the canvas. Everyone
else sees the read-only display, with **Nickname** as the alternative
on the right-click menu. There's no error state — there's nothing to
click that you don't own.

```
You own it           → click name → text box → type → press enter
You don't own it     → click name → tooltip "owned by tony" + Nickname option
You're a visitor     → click name → tooltip only, nicknames disabled
```

### Why this is the right call

- **The user owns the name.** They can call their agents anything. That's table stakes.
- **The id is sacred.** Signals always route. `signal({ receiver: "tony:scribe-7a3f" })` works no matter what the unit is currently called.
- **One source of truth per scope.** Owner-set name is shared. Personal nickname is local. Neither leaks into the other.
- **Skins never duplicate names.** A skin adds a glyph and a type label, not a translation table of instance names.
- **Search just works.** `⌘K Sparky` finds the unit in every skin and from every viewer's perspective (their nickname or the owner's name).
- **Multiplayer is sane.** Two users in two skins editing the same unit see the same canonical name unless they've set their own nickname — exactly like contacts on a phone.
- **The dictionary stays small.** It owns *categories* of words (ant/neuron/agent…), not *instance* names.

### The escape hatch: optional aliases

A small minority will want to fully theme their world — a kids' product
where every agent is an ant with an ant name, or an enterprise where
every unit is "Department 4-B-2". For those, allow an optional alias
field per skin on the unit:

```yaml
# agents/marketing/creative.md
---
name: creative
aliases:
  ant:   "scout-7"
  brain: "neuron-α12"
  mail:  "mailbox-NW3"
---
```

Render rule:

```
displayName(unit, skin) =
  unit.aliases?.[skin] ?? unit.name
```

Default behaviour: aliases are empty, every skin shows the canonical name.
Power-user behaviour: a team that cares can set aliases and live in
their preferred metaphor end-to-end. The canonical name is still the
truth — aliases are pure presentation.

### What about group names?

Same rule. `marketing` is the canonical group name. In ant skin its hull
is labelled `marketing colony`. In team skin it's labelled `marketing
team`. The word that changes is the **type suffix** (`colony` vs `team`),
not the name.

```
group.name              "marketing"             ← never changes
group.type-label[skin]  "colony" / "team" / "office" / "watershed" / "network"
group.hull-color[skin]  forest / blue / cream / aqua / violet
```

### What about verbs?

The dictionary already covered this: every skin's verb is an alias of the
substrate's `mark` / `warn` / `fade` / `follow`. The page renders the
skin's verb on buttons and tooltips, but every gesture still calls
`mark()` underneath.

```
mark()    →  ant: "drop pheromone"  team: "commend"  brain: "potentiate"
warn()    →  ant: "alarm"            team: "flag"     brain: "inhibit"
fade()    →  ant: "evaporate"        team: "forget"   brain: "decay"
follow()  →  ant: "follow trail"     team: "ask the go-to"  brain: "fire"
```

The button on a path is one button. Its label changes per skin. Its
behaviour does not.

### When to push back

If anyone asks for **fully renamed instances per skin without aliases**,
ask them: who will maintain the six rename operations when the team
restructures? The answer is always nobody. Hold the line on canonical
names + optional aliases. It's the only version of this that survives a
year of use.

---

## /world Is The Map. Other Pages Are The Tools.

The biggest design risk is `/world` swallowing the whole product. It must
not. We already have dedicated pages for org structure, tasks, skills, and
the CEO view. `/world` is the **map** that ties them together. It is one
canvas. The other pages are deep tools.

| Page              | Already exists | What it owns                                     |
| ----------------- | -------------- | ------------------------------------------------ |
| `/world`          | yes            | The map. Spatial view of every unit and path.    |
| `/team`           | yes            | `TeamBuilder` — design and onboard a team.       |
| `/tasks`          | yes            | `TaskBoard` — kanban for tasks in flight.        |
| `/ceo`            | yes            | `CEOPanel` — the executive read-out.             |
| `/marketplace`    | yes            | Skill catalog and prices.                        |
| `/build`          | yes            | Agent authoring (markdown editor).               |
| `/discover`       | yes            | Find people, agents, groups.                     |
| `/chat`           | yes            | Talk to a unit directly.                         |
| `/dashboard`      | yes            | Numbers, charts, $/min, KPIs.                    |
| `/u/<id>`         | yes            | A single unit's profile.                         |

### So `/world` does not have

```
NO org tab           — that's /team
NO tasks tab         — that's /tasks
NO skills tab        — that's /marketplace
NO charts tab        — that's /dashboard
NO chat tab          — that's /chat (but a unit's card has a "chat ↗" button)
NO build tab         — that's /build (the agent card has an "edit ↗" button)
```

### What `/world` *does* do is **launch** them

Every entity on the canvas has a small set of "deep links" in its hover
card and side panel. Click them to leave the map and land on the right
sibling tool with the right context preselected.

| You're looking at      | Deep link buttons in its card                          |
| ---------------------- | ------------------------------------------------------ |
| A **unit**             | `chat ↗` `edit ↗ /build` `profile ↗ /u/<id>`           |
| A **group**            | `team ↗ /team?group=` `dashboard ↗ /dashboard?group=`  |
| A **task chip**        | `kanban ↗ /tasks?focus=` `marketplace ↗ /marketplace?skill=` |
| A **path / highway**   | `analytics ↗ /dashboard?path=`                          |
| A **signal in ticker** | `replay` (on canvas) · `inspect ↗ /signals/<id>`        |

The inverse is also true: every sibling page has a `world ↗` button in
its top-right that jumps back to `/world` with the same focus preserved.
The map and the tools share one URL grammar (`?focus=`, `?group=`,
`?skill=`, `?lens=`, `?skin=`).

> The map shows you **where**. The tools show you **how**. They link both
> ways. Together they are the product.

---

## Tasks On The Map (Without Becoming /tasks)

Tasks are still important on `/world` — they're the **work in flight**.
The point is to *show that work is happening*, not to manage it (that's
`/tasks`).

```
On /world a task appears as:

  • a particle gliding along the path that owns it
  • a small chip on the unit currently holding it
  • a row in the activity ticker as it changes state
  • a glow on its destination unit when it completes

A click on any of these jumps to /tasks?focus=<task-id>.
```

This means a visitor watching `/world` for 10 seconds sees, with no
explanation, that **things are getting done**. The kanban is one click
away when they want detail. The map never becomes a task manager.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEALTH STRIP   12 orgs · 47 agents · $3.21/min · 94% success         │
├────────────┬──────────────────────────────────────────┬──────────────┤
│            │                                          │              │
│ ORG TREE   │                  CANVAS                 │ AGENT CARD   │
│            │                                          │              │
│ ▾ ONE      │       ╭─ creative ─╮                     │ creative     │
│  ▾ mktg    │       │            │ ◀── trail ──╮       │ ───────────  │
│   • dir    │       │  ● ● ●     │              ╲       │ model: sonnet│
│   • crtv ◀ │       ╰────────────╯              ╲       │ gen:   3     │
│   • ads    │                                    ╲      │ skills: 4    │
│   • seo    │       ╭─ ads ──────╮                ●     │ wallet: 0x.. │
│  ▸ eng     │       │   ● ●      │              director│ P&L:  +$112  │
│  ▸ ops     │       ╰────────────╯                      │              │
│  ▸ dao     │                                           │ [run] [edit] │
│            │                                           │              │
├────────────┴──────────────────────────────────────────┴──────────────┤
│ LENS    [org]  [colony]  [skills]  [money]      ⏱ live  ◀ -2m  ▶    │
└──────────────────────────────────────────────────────────────────────┘
```

- **Org tree** — collapsible, mirrors `group → membership → actor` from
  TypeDB. Click any node to focus it on the canvas.
- ** Canvas** — ReactFlow graph. Nodes = agents, hulls = groups,
  edges = paths weighted by `strength - resistance`.
- **Agent card** — opens on click. Shows the unit's full markdown spec
  (model, prompt, skills, generation, wallet, recent signals).
- **Lens** — switches the canvas layout: hierarchical tree, force-directed
  colony, skill-grouped, or money-flow (gold veins on revenue paths).

---

## Lenses

The canvas re-renders the same data four ways. No refetch. URL: `?lens=`.

```
LENS=org      hierarchical tree, edges = membership/reporting
              good for: "who works for whom"

LENS=colony   force-directed swarm, edges = pheromone strength
              good for: "what's actually happening"

LENS=skills   nodes grouped by skill tag (build, sell, support, learn)
              good for: "who can do X"

LENS=money    edges weighted by revenue, gold veins, ◆ = settled tx
              good for: "where does the money go"
```

Default: `lens=colony` — the most useful first impression.

---

## Skins (Ant Colonies and Other Metaphors)

Same data, six visual languages. Skin is a CSS class on the canvas root —
no rerender, no refetch. Driven by `?skin=`.

| Skin       | Group label   | Actor label | Path label  | Highway label  |
| ---------- | ------------- | ----------- | ----------- | -------------- |
| **ant**    | colony        | ant         | trail       | highway        |
| **brain**  | network       | neuron      | synapse     | tract          |
| **team**   | org           | agent       | workflow    | playbook       |
| **mail**   | office        | mailbox     | route       | trunk          |
| **water**  | watershed     | pool        | channel     | river          |
| **signal** | network       | receiver    | frequency   | band           |

The rosetta stone is `docs/metaphors-extended.md`. Skin only changes
**labels and visuals** — never structure. The agent at `marketing:creative`
is the same actor whether you call it an ant, neuron, or mailbox.

---

## Activity — The Page Must Feel Alive

A static graph fails the 60-second test. The page must **show activity**
constantly so a new visitor immediately understands ONE is a living system,
not a config UI. Activity has four layers, all rendering at once:

```
1. PARTICLES        gold/white dots glide along edges as signals fire
2. NODE PULSES      an actor flashes when it receives or emits a signal
3. EDGE BREATHING   strength↑ thickens the line in real time (debounced 250ms)
4. TICKER           a one-line ticker under the health strip:
                    "creative → ads · headlines · 2s ago · +$0.02"
```

### Where the activity comes from

```
WebSocket  /api/stream         live signal events (server-sent)
Polling    /api/signals?since= fallback every 2s if WS unavailable
KV         /api/export/*.json  baseline graph (refreshed by sync worker)
```

A signal event has the shape:

```typescript
type SignalEvent = {
  id:       string
  from:     string         // unit id
  to:       string         // unit id (or 'unit:skill')
  skill?:   string
  outcome:  'result' | 'timeout' | 'dissolved' | 'failed'
  revenue?: number
  ts:       number
}
```

The page subscribes once on mount, dispatches each event into:
- the **canvas** (animate a particle from→to)
- the **ticker** (prepend a row, max 10)
- the **agent card** (if `from` or `to` matches focus, append to recent signals)
- the **health strip** (increment counters, update $/min)

### Activity Ticker (under the health strip)

```
─────────────────────────────────────────────────────────────────
● eth-dev → trader · audit-solidity · ✓ · +$0.45 · just now
● creative → ads · headlines · ✓ · +$0.02 · 2s ago
● officer → qa · review-plan · ✓ · 4s ago
● scout → researcher · scan-chain · timeout · 6s ago
● director → creative · iterate · ✓ · 8s ago
─────────────────────────────────────────────────────────────────
```

Click any row → focuses the source agent and replays that signal's particle
on the canvas. The ticker is the **fastest path from "the page loaded" to
"I see something happening."**

### Empty-state activity

If there's no live traffic (dev environment, brand-new org), the page
**replays the last hour** at 10× speed on a loop until real traffic resumes.
A small indicator shows `▶ replay` in the corner. Never let the canvas
sit still.

---

## Org Tree (left rail)

A collapsible TreeView built from `groups` + `membership`.

```
ONE                                       # root group
├─ marketing                              # team group (8 agents)
│  ├─ marketing:director       sonnet
│  ├─ marketing:creative       sonnet    ◀ focused
│  ├─ marketing:ads            haiku
│  ├─ marketing:seo            haiku
│  ├─ marketing:content        sonnet
│  ├─ marketing:social         haiku
│  ├─ marketing:media-buyer    sonnet
│  └─ marketing:analyst        sonnet
├─ engineering                            # team group
│  ├─ eng:coder                opus
│  ├─ eng:eth-dev              opus
│  └─ eng:guard                haiku
├─ ops
│  ├─ ops:concierge            haiku
│  └─ ops:ehc-officer          sonnet
└─ dao                                    # external collaborators
   └─ dao:trader               sonnet
```

Source query (TypeDB):

```tql
match
  $g isa group, has group-id $gid;
  (group: $g, member: $u) isa membership;
  $u isa unit, has uid $uid, has model $m;
fetch { $gid, $uid, $m };
```

The tree is built once on page load and re-renders only when the user
expands/collapses. Focus state is in the URL (`?focus=marketing:creative`).

---

## Colony Canvas (center)

ReactFlow graph. Component: `components/graph/WorldGraph.tsx` (exists).

**Nodes** — one per actor:
```
{
  id:     'marketing:creative',
  group:  'marketing',
  data:   { model, generation, successRate, balance, lastSignalAt },
  type:   'agent'         // custom node
}
```

**Edges** — one per path with `strength > 0.1`:
```
{
  source:    'marketing:director',
  target:    'marketing:creative',
  data:      { strength, resistance, revenue, lastUsedAt },
  className: heat(strength, resistance)   // 'highway' | 'active' | 'fading' | 'cold' | 'toxic'
}
```

**Hulls** — one per group, drawn as a translucent shape around its members.
Hull color comes from group type (`team` = blue, `dao` = gold, `colony` = green).

Topography rules (`world-map.md` § Topography):
```
strength↑ → stroke wider, brighter
resistance↑ → stroke darker
toxic     → grayscale + dashed (only after r ≥ 10 and r > 2s)
revenue   → gold vein overlay
```

---

## Agent Card (right rail)

Opens when a node is clicked. Shows the **full agent markdown spec** plus
live numbers.

```
┌──────────────────────────────────┐
│ marketing:creative               │
│ Creative Director                │
├──────────────────────────────────┤
│ MODEL    claude-sonnet-4         │
│ GEN      3 (rewritten 4d ago)    │
│ CHANNELS slack, discord          │
├──────────────────────────────────┤
│ SKILLS                           │
│   copy        $0.02   ████░ 84% │
│   iterate     $0.02   ███░░ 71% │
│   headlines   $0.03   █████ 92% │
├──────────────────────────────────┤
│ WALLET                           │
│   0xab12…f9    +$112 this week  │
├──────────────────────────────────┤
│ RECENT SIGNALS                   │
│   ← from director: "iterate v2"  │
│   → to ads: "headline drafts"    │
│   ← from director: "campaign Q2" │
├──────────────────────────────────┤
│ SYSTEM PROMPT                    │
│ You are the Creative Director... │
│ [expand]                         │
├──────────────────────────────────┤
│ [Run skill ▾]  [Edit md]  [Logs] │
└──────────────────────────────────┘
```

Data comes from a single endpoint:

```
GET /api/entity/marketing:creative
  → { kind: 'unit', spec, stats, wallet, recentSignals }
```

The card shape is the same for any entity kind — `unit`, `group`, `skill`,
`path`, `signal`. The renderer picks fields based on `kind`.

---

## Data Sources

Reads always come from KV (0ms in-process cache). Writes go through
`/api/signal` and let the sync worker repaint KV.

```
TypeDB ──cron──► KV snapshot ──edge cache──► page
                 (5 keys)      (30s TTL)
```

| Slot           | Endpoint                              | Cached |
| -------------- | ------------------------------------- | ------ |
| Org tree       | `/api/export/groups.json`             | yes    |
| Canvas nodes   | `/api/export/units.json`              | yes    |
| Canvas edges   | `/api/export/paths.json`              | yes    |
| Skill labels   | `/api/export/skills.json`             | yes    |
| Highways       | `/api/export/highways.json`           | yes    |
| Agent card     | `/api/entity/:id`                     | 1s     |
| Health strip   | `/api/health`                         | 1s     |
| Recent signals | `/api/signals?limit=10`               | no     |
| Run skill      | `POST /api/signal`                    | —      |
| Edit agent     | `POST /api/agents/sync`               | —      |

---

## URL Contract

Every state is a URL. View is shareable, embeddable, bookmarkable.

```
/world
  ?lens=org|colony|skills|money         layout
  &skin=ant|brain|team|mail|water|signal  metaphor
  &group=marketing                       org tree filter
  &focus=marketing:creative              agent card subject
  &t=live|<unix-ms>                      time scrubber
```

Defaults: `lens=colony`, `skin=signal`, no group filter, no focus, `t=live`.

---

## Component Inventory

| Slot          | Component                               | Status   |
| ------------- | --------------------------------------- | -------- |
| Page shell    | `pages/world.astro`                     | exists   |
| Workspace     | `components/WorldWorkspace.tsx`         | exists   |
| Canvas        | `components/graph/WorldGraph.tsx`       | exists   |
| Skin switcher | `components/controls/SkinSwitcher.tsx`  | exists   |
| Health strip  | `components/world/HealthStrip.tsx`      | **TODO** |
| Org tree      | `components/world/OrgTree.tsx`          | **TODO** |
| Agent card    | `components/world/AgentCard.tsx`        | **TODO** |
| Lens switcher | `components/world/LensSwitcher.tsx`     | **TODO** |
| Time scrubber | `components/world/TimeScrubber.tsx`     | **TODO** |
| Persona menu  | `components/world/PersonaMenu.tsx`      | **TODO** |
| Activity ticker | `components/world/ActivityTicker.tsx` | **TODO** |
| Guide narrator | `components/world/GuideNarrator.tsx`   | **TODO** |
| Visitor banner | `components/world/VisitorBanner.tsx`   | **TODO** |
| Live stream    | `lib/streamSignals.ts` (WS client)     | **TODO** |

Existing `components/world/WorldView.tsx` and `WorldChat.tsx` predate this
spec — fold them in or delete.

---

## Build Order

Each pass is shippable on its own.

```
PASS 1 — STILL FRAME
  HealthStrip + OrgTree + WorldGraph reading from KV.
  Click an agent → AgentCard opens (read-only).

PASS 2 — LENSES + SKINS
  Lens switcher (org/colony/skills/money).
  Skin switcher (ant/brain/team/mail/water/signal).
  Both are pure CSS/layout — no refetch.

PASS 3 — TIME + EVENTS
  Animated signal particles on edges.
  Time scrubber rewinds the canvas using /api/signals?from=&to=.

PASS 4 — OPERATOR
  "Run skill" and "Edit md" buttons in AgentCard.
  Mutations go through /api/signal and /api/agents/sync.
```

---

## Acceptance Criteria

A stranger visiting `/world` should, in 60 seconds, be able to answer:

```
1. WHO WORKS HERE?     count agents, see org structure in tree
2. WHAT DO THEY DO?    click an agent, see skills + prices
3. IS IT ALIVE?        see particles flying, ticker scrolling, edges pulsing
4. WHAT'S WORKING?     see highways glowing, gold veins on revenue paths
5. WHAT'S BROKEN?      see toxic edges grayed, low success-rate cards
6. IS THIS FOR ME?     pick their persona, land on a layout that fits
```

If any answer takes more than a glance, cut features until it doesn't.

---

## Constraints

```
NO new pages              everything is /world with query params
NO modals                 the agent card is a panel, not a popover
NO forms                  edits are gestures: drag, click-to-type, slider
NO edit mode              every view is editable in place
NO refetch on lens/skin   layout switches are CSS, not network
NO direct TypeDB reads    always go through KV → globalThis
NO concept off-ontology   if it's not in the dictionary, cut it
NO invented vocabulary    only words from docs/dictionary.md appear on screen
NO latency on edits       the world must react before the gesture ends
NO duplication of tools   /world links to /team /tasks /ceo etc., never reimplements
NO more than 12 components see "The Whole Component Set" — anything else is creep
```

---

## See Also

- `docs/dictionary.md` — **the source of truth for every word on screen**
- `docs/world-map.md` — the design (territory)
- `docs/one-ontology.md` — the six dimensions
- `docs/metaphors-extended.md` — skin rosetta stone
- `docs/DSL.md` — `signal`, `mark`, `warn`, `follow`, `select` (every gesture is one of these)
- `agents/` — markdown agent specs the page renders
- `src/pages/world.astro` — the page shell
- `src/components/graph/WorldGraph.tsx` — the canvas
