# Colony

**A real-time strategy game where you don't control the ants. You influence the colony.**

The substrate IS the game engine. Every mechanic is a primitive. Nothing is simulated.

---

## The Hook

You are a colony. Not a commander — a colony.

You can't tell ants where to go. You can hatch them, place scent markers, and
set the colony's personality. The ants do the rest. Trails form. Highways emerge.
Food flows. Threats get walled off. The colony learns.

Your opponent has the same tools. Their colony learns too.

The question isn't "who clicks faster." It's **who builds better feedback loops.**

---

## Core Loop

```
hatch ants     →  they forage  →  trails form  →  highways emerge
     ↑                                                    │
     └────── food returns ← harvesters follow highways ←──┘
```

Every cycle of this loop is one substrate tick. The game runs in real time.

---

## The Map

A shared hex grid. Two nests. Scattered food sources. Obstacles. Fog of war
that lifts as scouts explore.

```
  ╔══════════════════════════════════════════════╗
  ║     ~  ~     🍯        ⬡  ⬡  ⬡     ~  ~    ║
  ║  ~     [NEST A]    ⬡        ⬡    ~     ~    ║
  ║     ⬡        ⬡  🍯  ███  ███  🍯        ⬡  ║
  ║  ⬡     ⬡        ███        ███     ⬡     ⬡  ║
  ║     🍯     ⬡  ███     🍯      ███  ⬡  🍯   ║
  ║  ⬡     ⬡        ███        ███     ⬡     ⬡  ║
  ║     ⬡        ⬡  🍯  ███  ███  🍯        ⬡  ║
  ║  ~     ~    ⬡        ⬡    [NEST B]  ~      ║
  ║     ~  ~     🍯        ⬡  ⬡  ⬡     ~  ~    ║
  ╚══════════════════════════════════════════════╝

  🍯 = food source    ███ = obstacle    ~ = fog    ⬡ = explored
```

Food sources deplete. New ones spawn. The map shifts. Old trails fade.

---

## Ant Types (Units)

You don't build ants. You **hatch** them. Each type has a sensitivity that
determines how it routes through the world.

| Ant | Sensitivity | Behavior | Substrate Mapping |
|-----|:-----------:|----------|-------------------|
| **Scout** | 0.1 | Explores weak paths, finds new food | `select()` with low sensitivity |
| **Harvester** | 0.9 | Follows highways, carries food home | `follow()` strongest path |
| **Guard** | 0.5 | Patrols borders, marks threats | `warn()` on enemy trails |
| **Nurse** | 0.7 | Tends queen, speeds hatching | `mark()` on nest paths |
| **Queen** | — | Hatches ants, sets colony tempo | `add()` new units |

```
weight = 1 + max(0, strength - resistance) × sensitivity

Scout:     weight = 1 + trail × 0.1   →  all paths look ~equal
Harvester: weight = 1 + trail × 0.9   →  highways dominate
Guard:     weight = 1 + trail × 0.5   →  balanced awareness
```

---

## Player Actions

You influence, not command. Five actions, each a substrate verb.

### 1. Hatch (add)
Spend food to hatch an ant type. More complex ants cost more.

```
Scout:     10 food    →  nest.hatch('scout')
Harvester: 20 food    →  nest.hatch('harvester')
Guard:     25 food    →  nest.hatch('guard')
Nurse:     15 food    →  nest.hatch('nurse')
```

### 2. Scent (enqueue)
Place a pheromone marker on any explored hex. Ants will investigate.

```
drop scent on hex(4,7)  →  nest.enqueue({ receiver: 'scout:explore', data: { hex: [4,7] } })
```

This is your only "command." It's a suggestion, not an order.
The scent fades. If ants find nothing there, the trail dies.

### 3. Alarm (warn)
Mark a hex as dangerous. Guards will patrol. Other ants avoid it.

```
alarm on hex(6,3)  →  nest.alarm('*→hex(6,3)', 1)
```

### 4. Colony Mood (sensitivity)
Shift your colony between exploration and exploitation.

```
┌─────────────────────────────────────────────┐
│  EXPLORE ◄━━━━━━━━━●━━━━━━━━━━► EXPLOIT    │
│                    0.5                       │
└─────────────────────────────────────────────┘

explore (0.1) → scouts scatter, find new food, ignore highways
exploit (0.9) → harvesters swarm highways, maximum throughput
```

Exploration finds food. Exploitation collects it. The tension IS the game.

### 5. Evolve (know)
Spend accumulated knowledge to permanently upgrade a trail.

```
imprint trail(nest→food3)  →  nest.imprint()
```

Imprinted trails don't fade. They become permanent highways.
But if the food source depletes, you've wasted your knowledge.

---

## What the Ants Do (Autonomous Behavior)

You don't script this. The substrate does it.

### Scouts
```
1. select() a path (low sensitivity → explores weak trails)
2. Move to target hex
3. If food found → deposit() pheromone on return trail
4. If nothing   → trail fades naturally
5. If threat    → alarm() the path
```

### Harvesters
```
1. follow() strongest trail (high sensitivity → sticks to highways)
2. Move to food source
3. Pick up food
4. Return to nest (follow return trail)
5. deposit() on the round-trip path → trail gets stronger
```

### Guards
```
1. Patrol border hexes (medium sensitivity)
2. If enemy ant detected → alarm() the path
3. If enemy trail detected → warn() to counter their pheromone
4. Enemy ants touching alarm pheromone → slowed/turned back
```

### The Emergent Behavior

Nobody codes "find the shortest path." It emerges:
- Shorter paths get more round-trips per minute
- More round-trips = more pheromone deposited
- More pheromone = more ants choose that path
- The shortest path becomes the highway. Automatically.

Nobody codes "abandon depleted food." It emerges:
- Food source runs out → harvesters return empty
- Empty returns → no pheromone deposited
- No new pheromone + fade() → trail evaporates
- Ants redistribute to other trails. Automatically.

---

## Combat

No health bars. No attack stats. **Pheromone warfare.**

### Trail Interference
Your guards can deposit alarm pheromone on enemy trails.
This raises resistance on their paths. Their highways weaken.

```
your guard → warn(enemy_trail, 1)
  → enemy resistance increases
  → enemy weight = 1 + (strength - resistance) × sensitivity
  → if resistance > 2× strength → trail goes TOXIC
  → enemy ants abandon that path
```

### Territory
A hex belongs to whoever has stronger pheromone on paths through it.
Territory shifts as trails strengthen and fade. Borders are fluid.

### Toxic Paths
When resistance >= 10 and resistance > 2x strength → the path is toxic.
Ants won't use it. It's a wall made of bad experiences.

You can weaponize this: send guards to poison key junctions.
But your guards are expensive, and the resistance fades 2x faster than strength.
Sustained warfare costs more than it returns.

**The substrate's math makes peace more efficient than war.**

---

## Economy

Food is the only resource. It flows through the substrate.

```
food source → harvester carries → nest stores → hatch ants / imprint trails
                                        │
                                        └→ per-tick upkeep (each ant costs 1 food/tick)
```

Run out of food → ants start dying (remove). Furthest from nest first.
The colony contracts toward its strongest highways.

### Revenue on Paths
Each food delivery marks the path with economic value.
The substrate tracks which trails generate the most food.
This IS the L4 economic loop — `revenue on paths`.

---

## Winning

Three victory conditions:

| Victory | Condition | Substrate Concept |
|---------|-----------|-------------------|
| **Dominance** | Control 75% of food sources | Highway coverage |
| **Knowledge** | Imprint 10 permanent trails | know() accumulation |
| **Collapse** | Enemy queen starves | Economic failure |

---

## The Seven Loops (In-Game)

The substrate's seven loops ARE the game's progression:

```
L1 SIGNAL    per ant action     ant forages → outcome
L2 TRAIL     per outcome        deposit/alarm → trails shift
L3 FADE      every few seconds  trails evaporate, old paths disappear
L4 ECONOMIC  per food delivery  revenue accumulates on paths
L5 EVOLUTION every 2 minutes    struggling ant types adapt behavior
L6 KNOWLEDGE every 5 minutes    colony can imprint proven trails
L7 FRONTIER  every 5 minutes    unexplored regions highlighted on map
```

Early game: L1-L3 dominate. You're exploring, trails are volatile.
Mid game: L4-L5 kick in. Economy matters. Ants adapt.
Late game: L6-L7 decide it. Knowledge is permanent. Frontiers are few.

---

## What Makes It Different

1. **No micro.** You can't click an ant. You influence the colony.
2. **Emergent strategy.** Shortest paths, efficient foraging, territory — all emerge from five verbs.
3. **Real math.** The pheromone formula isn't a game mechanic bolted on. It IS the engine.
4. **Asymmetric decay.** Resistance fades 2x faster than strength. Aggression is expensive. The math rewards builders.
5. **The explore/exploit dial.** One slider. The deepest decision in the game.

---

## Implementation

The game is a visualization layer over the substrate.

```
┌─────────────────────────────────────────┐
│           GAME UI (React 19)            │
│  hex grid, ant sprites, trail colors    │
├─────────────────────────────────────────┤
│         SUBSTRATE (world.ts)            │
│  signal, mark, warn, fade, select       │
├─────────────────────────────────────────┤
│           BRAIN (TypeDB)                │
│  paths, knowledge, evolution            │
└─────────────────────────────────────────┘
```

The hex grid renders `highways()` as colored trails.
Ant movement is `select()` / `follow()` visualized.
Combat is `warn()` visualized as red pheromone.
The explore/exploit slider sets colony-wide sensitivity.

No game engine needed. The substrate is the engine.

---

## Modes

### Solo: Trials
Pre-built maps with objectives. Learn the mechanics.
- "Find all food sources" (scouts + exploration)
- "Harvest 100 food in 60 seconds" (harvesters + exploitation)
- "Block the enemy trail" (guards + alarm pheromone)
- "Build 3 permanent highways" (knowledge + imprint)

### Versus: Colony Wars
Two players, one map, real-time. The explore/exploit tension
against a thinking opponent.

### Sandbox: Terrarium
No opponent. No objectives. Just a colony.
Watch trails form. Watch highways emerge.
Place food. Place obstacles. Learn emergence.

---

*You don't play the ants. You play the colony. The ants play themselves.*
