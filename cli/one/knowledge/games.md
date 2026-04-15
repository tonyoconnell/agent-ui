# Games as Systems in ONE

## Overview

Game design is fundamentally about designing systems that pose problems and create learning loops. The ONE 6-dimension ontology is perfectly suited to modeling games because both are systems-based.

This document maps Raph Koster's 12-step game design framework to ONE's 6 dimensions, showing how to build games, gamified experiences, and challenge systems within the platform.

**Core insight:** A game is a set of Things connected by Rules (Connections), producing Events (feedback and progression), with Knowledge (strategy and mastery) accumulated by People in Groups.

---

## The 12 Game Design Principles in ONE

### 1. Fun = Mastery of Problems

**Definition:** Fun is the process of learning to predict outcomes and solve problems. Progress feels good because you're improving.

**ONE mapping:**

```typescript
// Thing: Challenge or Game
{
  type: "challenge",
  name: "Boss Battle",
  properties: {
    difficulty: 5,  // 1-10 scale
    category: "combat",  // mastery domain
    skillRequired: ["timing", "pattern_recognition"],
  }
}

// Events: track player mastery progression
{
  type: "challenge_completed",
  targetId: challengeId,
  actorId: playerId,
  metadata: {
    attemptsNeeded: 3,  // learning curve indicator
    strategiesUsed: ["dodge_roll", "power_attack"],
    timeToSolve: 120000,  // ms
    masteryLevel: "intermediate"
  }
}

// Knowledge: store winning strategies for learning
{
  type: "strategy",
  label: "Boss Pattern #3",
  content: "After third combo, boss is vulnerable for 2 seconds...",
  linkedThings: [challengeId, playerId]
}
```

**Best practice:** Track attempts, strategies employed, and time-to-solution. This data shows mastery progression.

---

### 2. Problems and Toys

**Definition:** A problem has constraints (rules) AND a goal. A toy has constraints but no goal. Games are toys that someone stuck a goal on.

**ONE mapping:**

```typescript
// Thing: Problem (Toy with rules)
{
  type: "game_system",
  name: "Combat System",
  properties: {
    rules: {
      maxHealth: 100,
      attackDamage: 10,
      dodgeChance: 0.2,
      // Constraints define the playing space
    },
    goalType: null,  // This is a TOY - just mechanics
  }
}

// Thing: Challenge (Problem with goal)
{
  type: "challenge",
  name: "Defeat Goblin",
  properties: {
    systemId: combatSystemId,
    goal: "reduce_enemy_health_to_zero",
    winCondition: "enemyHealth <= 0",
    loseCondition: "playerHealth <= 0 || timeElapsed > 300000"
  }
}

// Connection: Challenge uses System
{
  type: "uses",
  from: challengeId,
  to: combatSystemId,
  metadata: {
    rules: "inherit",  // Challenge inherits combat rules
    constraints: "apply"
  }
}
```

**Best practice:** Start with toys (just rules and mechanics). Layer goals on top to create problems. This lets players invent their own goals (emergent play).

---

### 3. Prediction and Uncertainty

**Definition:** Games are uncertainty machines. The player doesn't know the outcome until they try. Good problems have multiple solutions and require adaptation.

**ONE mapping:**

```typescript
// Thing: Challenge with variance
{
  type: "challenge",
  name: "Maze Escape",
  properties: {
    deterministicSolution: false,  // Multiple valid paths
    uncertaintyFactors: [
      "random_enemy_positions",
      "random_item_placement",
      "dynamic_obstacles"
    ],
    minSolutions: 5,  // At least 5 different ways to win
    maxSolutions: "infinite",  // Open-ended problems are best
  }
}

// Knowledge: store discovered solutions (player-generated)
{
  type: "solution",
  label: "Speed Run Route",
  content: "Avoid north corridor, use hidden west passage...",
  creator: playerId,
  linkedThings: [challengeId],
  discoveredAt: timestamp,
  validation: "unverified" // Player discovered, not official
}

// Events: track solution diversity
{
  type: "challenge_solved",
  targetId: challengeId,
  actorId: playerId,
  metadata: {
    solutionPath: ["door_west", "climb_wall", "exit_north"],
    timeToSolve: 45000,
    uniqueness: "novel"  // First time anyone tried this path
  }
}
```

**Best practice:** Design problems where the first answer works temporarily, then breaks. Force players to develop deeper strategies. Track solution diversity—if everyone solves it the same way, add randomness or complexity.

---

### 4. Loops

**Definition:** The operational loop is predict → test → update hypothesis. The progression loop (spiral) is doing the same action in different situations to gradually master the system.

**ONE mapping:**

```typescript
// Thing: Core Loop definition
{
  type: "game_loop",
  name: "Combat Loop",
  properties: {
    operationalLoop: {
      steps: [
        "perceive_enemy_state",
        "form_hypothesis",  // "They'll attack left"
        "choose_action",    // "I'll dodge right"
        "see_result",       // Hit/miss/partial
        "update_model"      // Refine hypothesis
      ]
    },
    progressionLoop: {
      repeatAction: "engage_enemy",
      varyingSituation: [
        "different_enemy_types",
        "different_health_levels",
        "time_pressure"
      ],
      skillExercised: "pattern_recognition"
    }
  }
}

// Events: track loop iterations
{
  type: "loop_iteration",
  targetId: challengeId,
  actorId: playerId,
  metadata: {
    loopType: "operational",
    iteration: 15,
    hypothesis: "Enemy attacks after 3 steps",
    action: "dodge_right",
    result: "hit",
    updatedModel: "Enemy attacks after 4 steps"
  }
}

// Connection: Challenge contains Loop
{
  type: "contains",
  from: challengeId,
  to: gameLoopId,
  metadata: {
    loopsRequired: "10-20",  // Spiral upward through iterations
    skillGrowth: "exponential"
  }
}
```

**Best practice:** The verbs stay the same ("punch," "dodge," "block"), but situations change. Spiraling, not repeating. Track hypothesis updates as learning signals.

---

### 5. Feedback

**Definition:** Players need to know (1) what actions are available, (2) that they used an action, (3) how it changed the state, (4) whether it helped.

**ONE mapping:**

```typescript
// Thing: Feedback System
{
  type: "feedback_system",
  name: "Combat Feedback",
  properties: {
    affordances: {
      availableActions: ["punch", "kick", "dodge", "block"],
      presentation: "buttons_on_hud"
    },
    actionConfirmation: {
      sound: "punch.mp3",
      animation: "punch_animation",
      haptic: "vibrate_200ms"
    },
    stateChange: {
      enemyHealth: "decrease_visible",
      playerStamina: "deplete_bar",
      hitEffect: "damage_number_popup"
    },
    evaluation: {
      good: "green_number_+_sound",
      bad: "red_number_−_sound",
      neutral: "gray_number_no_sound"
    }
  }
}

// Events: every action must produce feedback
{
  type: "action_performed",
  targetId: challengeId,
  actorId: playerId,
  metadata: {
    action: "punch",
    feedback: {
      affordanceShown: true,
      confirmationTriggered: true,
      stateChangeVisible: true,
      evaluationClear: true,
    },
    quality: "excellent"  // All four feedback layers present
  }
}
```

**Best practice:** Feedback is where you layer in delight. Make it surprising, juicy, delightful. But also make it clear—players must understand causality.

---

### 6. Variation and Escalation

**Definition:** The same core problem in different situations. As players master one variation, introduce new ones. This creates the learning ladder.

**ONE mapping:**

```typescript
// Thing: Problem (abstract)
{
  type: "problem_category",
  name: "Resource Management",
  properties: {
    coreChallenge: "allocate_limited_resources_to_goals",
    abstractForm: "maximize_output_minimize_waste"
  }
}

// Things: Specific instances with escalation
{
  type: "challenge",
  name: "Simple Farming",
  properties: {
    problem: "resource_management",
    difficulty: 1,
    variables: {
      resources: ["water", "seeds"],
      complexity: "low",
      timePressure: "none"
    }
  }
},
{
  type: "challenge",
  name: "Complex Farm (Drought)",
  properties: {
    problem: "resource_management",
    difficulty: 5,
    variables: {
      resources: ["water", "seeds", "pesticides", "labor"],
      complexity: "high",
      timePressure: "harsh"
    }
  }
}

// Connection: Challenge progression
{
  type: "unlocks",
  from: simpleFarmId,
  to: complexFarmId,
  metadata: {
    unlockCondition: "masterySoFar >= 'intermediate'",
    escalationPattern: "addComplexity"
  }
}

// Events: track when old strategies stop working
{
  type: "strategy_invalidated",
  targetId: complexFarmId,
  actorId: playerId,
  metadata: {
    previousStrategy: "water_everything_equally",
    failurePoint: "drought_conditions",
    newStrategyRequired: "prioritize_by_crop_value"
  }
}
```

**Best practice:** Design problem families, not isolated challenges. Each instance should use the core loop but vary topology/constraints. Track when players must abandon old strategies.

---

### 7. Pacing and Balance

**Definition:** Learning curve should rise (challenge increases), hit peaks (boss moments), then give breathers. Intensity should match player skill at each moment.

**ONE mapping:**

```typescript
// Thing: Progression curve
{
  type: "progression_design",
  name: "Campaign Pacing",
  properties: {
    shape: "sine_wave",
    phases: [
      {
        name: "Intro",
        difficulty: 1,
        duration: 300000,
        type: "tutorial"
      },
      {
        name: "Build",
        difficulty: 2-4,
        duration: 600000,
        type: "skill_practice"
      },
      {
        name: "Peak",
        difficulty: 7,
        duration: 120000,
        type: "boss_challenge"
      },
      {
        name: "Breather",
        difficulty: 3,
        duration: 180000,
        type: "story_interlude"
      },
      {
        name: "Rise",
        difficulty: 5-6,
        duration: 480000,
        type: "escalation"
      }
    ]
  }
}

// Connection: Challenge in progression curve
{
  type: "in_sequence",
  from: challengeId,
  to: progressionDesignId,
  metadata: {
    sequence: 15,
    intendedDifficulty: 4,
    actualDifficulty: 3.2,  // Measured from player data
    differenceFactor: -0.8,  // Slightly easier than intended
    adjustment: "increase_for_next"
  }
}

// Events: difficulty feedback loop
{
  type: "difficulty_measured",
  targetId: challengeId,
  metadata: {
    completionRate: 0.92,  // 92% of players beat it
    avgAttemppts: 2.1,
    engagementLevel: "high",
    recommendation: "slightly_harder_next_challenge"
  }
}
```

**Best practice:** Monitor completion rates and attempts. If completion > 95%, next challenge is too easy. If < 50%, too hard. Track the tension curve shape across your campaign.

---

### 8. Games are Made of Games

**Definition:** Complex games are networks of simpler loops. Each loop feeds into others. Map this as a dependency graph.

**ONE mapping:**

```typescript
// Thing: Simple loop #1
{
  type: "game_loop",
  name: "Aiming Loop",
  properties: {
    input: "mouse_position",
    output: "crosshair_position"
  }
}

// Thing: Simple loop #2
{
  type: "game_loop",
  name: "Firing Loop",
  properties: {
    input: "click_timing",
    output: "projectile_spawned"
  }
}

// Thing: Complex loop (FPS)
{
  type: "game_loop",
  name: "Combat Loop",
  properties: {
    subLoops: ["aiming", "firing", "movement", "reload"],
    composition: "sequential_and_parallel"
  }
}

// Connections: Show loop dependencies
[
  {
    type: "contains",
    from: combatLoopId,
    to: aimingLoopId,
    metadata: { outputFeeds: "input_for_firing" }
  },
  {
    type: "contains",
    from: combatLoopId,
    to: firingLoopId,
    metadata: { outputFeeds: "projectile_spawned" }
  }
]

// Knowledge: Map the problem web
{
  type: "systems_map",
  label: "FPS Loop Diagram",
  content: "Aiming → Firing → Hit Detection → Damage → Enemy Reaction...",
  linkedThings: [combatLoopId, aimingLoopId, firingLoopId]
}
```

**Best practice:** Diagram your loops before coding. Show how output of one becomes input to another. This is your systems design specification.

---

### 9. Actual Systems Design

**Definition:** Choose from known problem categories and recombine them. The universe of games is made from a smaller set of "elemental problems."

**ONE mapping:**

```typescript
// Things: Elemental problem types
{
  type: "problem_type",
  name: "Puzzle: Mathematical Complexity",
  properties: {
    category: "cognition",
    examples: ["A* pathfinding", "resource_allocation", "spatial_reasoning"],
    gameExamples: ["Tetris", "Sudoku", "Portal"]
  }
},
{
  type: "problem_type",
  name: "Social: Understanding Others",
  properties: {
    category: "interpersonal",
    examples: ["predict_behavior", "coordinate_strategy", "read_emotions"],
    gameExamples: ["Poker", "Trading", "Diplomacy"]
  }
},
{
  type: "problem_type",
  name: "Physical: Mastering Body/Reflexes",
  properties: {
    category: "motor",
    examples: ["timing", "precision", "rhythm"],
    gameExamples: ["Flappy Bird", "Dark Souls", "Guitar Hero"]
  }
}

// Things: Game designs that combine problem types
{
  type: "game_design",
  name: "Chess",
  properties: {
    primaryProblems: [
      "mathematical_complexity",  // Evaluate board states
      "social_modeling"           // Predict opponent moves
    ],
    secondaryProblems: []
  }
}

// Connection: Design uses problems
{
  type: "combines",
  from: gameDesignId,
  to: problemTypeId,
  metadata: {
    weight: 0.7,  // How central this problem is
    reskinVariations: ["chess_3d", "chess_with_time", "chess_with_chaos"]
  }
}
```

**Best practice:** Build a catalog of solved problems. Most "new" game mechanics are old problems with new skins. Combine 2-3 elemental problems to create novel games.

---

### 10. Dressing and Experience

**Definition:** The presentation (art, story, audio, theme) frames how the player perceives the problem. Same problem, different dressing = different game.

**ONE mapping:**

```typescript
// Thing: Core problem (naked)
{
  type: "core_mechanic",
  name: "Tower Defense Loop",
  properties: {
    abstractProblem: "allocate_resources_to_defend_positions",
    nouns: ["attacker", "defender", "resource", "position"]
  }
}

// Thing: Dressing #1
{
  type: "game_dressing",
  name: "Medieval Fantasy Tower Defense",
  properties: {
    theme: "fantasy",
    setting: "castle_under_siege",
    nounMapping: {
      attacker: "orc_horde",
      defender: "knight",
      resource: "gold_coins",
      position: "tower"
    },
    metaphors: ["defend_your_homeland", "build_fortifications"],
    narrative: "heroic_defense",
    art: "medieval_fantasy_aesthetic",
    audio: "dramatic_orchestral"
  }
}

// Thing: Dressing #2
{
  type: "game_dressing",
  name: "Sci-Fi Tower Defense",
  properties: {
    theme: "cyberpunk",
    setting: "space_station_under_attack",
    nounMapping: {
      attacker: "alien_swarm",
      defender: "robot_drone",
      resource: "energy_credits",
      position: "reactor"
    },
    metaphors: ["defend_the_station", "manage_power_grid"],
    narrative: "desperate_survival",
    art: "neon_sci_fi",
    audio: "electronic_synth"
  }
}

// Connection: Dressing applies to mechanic
{
  type: "applies_to",
  from: dressingId,
  to: coreMechanicId,
  metadata: {
    problemSame: true,
    experienceCompletely: "different"
  }
}

// Knowledge: Metaphor analysis
{
  type: "metaphor_study",
  label: "Tower Defense Reskinning",
  content: "Same loop, different metaphors change emotional resonance...",
  linkedThings: [coreMechanicId, dressingId1, dressingId2]
}
```

**Best practice:** Design the problem first. Then dress it thematically. The same mechanic can evoke wildly different emotions based on dressing. Track which dressings engage which audience segments.

---

### 11. Motivations

**Definition:** Different people enjoy different problem types. Motivations are psychographic filters—who is this game for?

**ONE mapping:**

```typescript
// Things: Motivation profiles
{
  type: "player_motivation",
  name: "Mastery",
  properties: {
    description: "Enjoy solving hard problems, optimizing strategies",
    preferredProblems: [
      "mathematical_complexity",
      "puzzle_solving",
      "skill_expression"
    ],
    appealsTo: ["engineers", "mathematicians", "speedrunners"],
    gameExamples: ["StarCraft", "Dota 2", "Magic: The Gathering"],
    psychographics: {
      mindset: "growth_oriented",
      competitiveness: "high",
      patience: "high",
      socialPreference: "competitive"
    }
  }
},
{
  type: "player_motivation",
  name: "Story & Immersion",
  properties: {
    description: "Enjoy narrative, world-building, emotional investment",
    preferredProblems: [
      "narrative_choice",
      "character_understanding",
      "world_exploration"
    ],
    appealsTo: ["writers", "readers", "empathetic_players"],
    gameExamples: ["The Last of Us", "Disco Elysium", "Baldur's Gate 3"],
    psychographics: {
      mindset: "exploratory",
      competitiveness: "low",
      patience: "high",
      socialPreference: "cooperative"
    }
  }
}

// Connection: Game targets motivation
{
  type: "targets",
  from: gameDesignId,
  to: playerMotivationId,
  metadata: {
    primaryTarget: true,
    weight: 0.8
  }
}

// People: Player profiles
{
  type: "creator",  // Or customer, learner, etc.
  role: "player",
  properties: {
    motivations: ["mastery", "competitive_achievement"],
    skillLevel: "advanced",
    playstyle: "min_max_optimization",
    preferredGenres: ["strategy", "roguelikes"]
  }
}
```

**Best practice:** Define your audience's motivations upfront. Build game pillars around those motivations. This makes scoping decisions easier and marketing more effective.

---

### 12. It's Simple But Hard

**Definition:** Understanding all 11 steps is more valuable than expertise in one. Each depends on others. Mastery requires growth across the whole system.

**ONE mapping:**

```typescript
// Thing: Game design discipline
{
  type: "discipline",
  name: "Game Design",
  properties: {
    components: [
      "fun_psychology",
      "systems_thinking",
      "uncertainty_design",
      "loop_architecture",
      "feedback_design",
      "content_variation",
      "pacing_science",
      "composition",
      "problem_taxonomy",
      "experience_design",
      "psychology_motivations",
      "mastery_and_depth"
    ],
    interdependency: "fractal",  // Each part contains all others
    masteryCurve: "asymptotic",  // Never finished learning
    depth: "infinite"
  }
}

// Events: Designer growth
{
  type: "designer_milestone",
  targetId: designerId,
  metadata: {
    gainsUnderstanding: [
      "fun_loops",
      "problem_design",
      "feedback_layers"
    ],
    timestamp: Date.now(),
    learningSource: "practice_and_failure"
  }
}

// Knowledge: Design patterns catalog
{
  type: "pattern_library",
  label: "Game Design Patterns",
  content: "Documented reusable solutions for common problems...",
  categories: [
    "reward_systems",
    "progression_mechanics",
    "difficulty_curves",
    "loop_composition"
  ]
}
```

**Best practice:** Treat game design like a game itself. You're at the edge of your mastery. Embrace failure as learning. Every shipped game makes the next one easier.

---

## Applying Games to ONE: Practical Examples

### Example 1: Gamified Learning Platform

```typescript
// Group: Learning Organization
{
  type: "organization",
  name: "Code Academy",
  parentGroupId: platformId
}

// Things: Courses as problem hierarchies
{
  type: "course",
  name: "JavaScript Fundamentals",
  groupId: codeAcademyId,
  properties: {
    difficulty: 1,
    problemType: "skill_building",
    loopsRequired: 20
  }
},
{
  type: "lesson",
  name: "Functions & Scope",
  groupId: codeAcademyId,
  properties: {
    difficulty: 1,
    loopType: "operational",
    feedback: {
      codeExecution: true,
      errorMessages: "helpful",
      hints: "on_demand"
    }
  }
},
{
  type: "challenge",
  name: "Build a Calculator",
  groupId: codeAcademyId,
  properties: {
    difficulty: 3,
    problemCategory: "composition",
    requiresLoops: ["function_definition", "variable_scope", "control_flow"]
  }
}

// Events: Track learning progression
{
  type: "challenge_completed",
  targetId: calculatorChallengeId,
  actorId: studentId,
  metadata: {
    attemptsNeeded: 5,
    strategiesUsed: ["test_driven_development", "incremental_building"],
    timeToSolve: 1800000,
    masteryLevel: "intermediate",
    feedbackQuality: "excellent"
  }
}

// Knowledge: Community solutions
{
  type: "solution",
  label: "Elegant Calculator Implementation",
  creator: advancedStudentId,
  linkedThings: [calculatorChallengeId],
  properties: {
    approach: "object_oriented",
    elegance: "high",
    readability: "high"
  }
}
```

### Example 2: Product Competition (Gamified Commerce)

```typescript
// Things: Competition structure
{
  type: "competition",
  name: "Q4 Sales Challenge",
  groupId: salesTeamId,
  properties: {
    problemType: "resource_management",
    duration: 7776000000,  // 3 months in ms
    pacing: {
      phases: ["build", "peak", "breather", "final_push"],
      difficultyProgression: "sigmoid"
    }
  }
},
{
  type: "leaderboard",
  name: "Sales Challenge Leaderboard",
  groupId: salesTeamId,
  properties: {
    metric: "revenue_generated",
    updateFrequency: "real_time",
    visibility: "public"
  }
}

// Events: Track competition moments
{
  type: "sale_recorded",
  targetId: customerId,
  actorId: salesPersonId,
  metadata: {
    amount: 5000,
    timestamp: Date.now(),
    competitionId: challengeId,
    leaderboardPosition: 3,
    feedbackTrigger: "notify_on_milestone"  // Leaderboard movement
  }
}

// Connections: Team dynamics
{
  type: "collaborates_with",
  from: salesPersonId,
  to: coachId,
  metadata: {
    roleInGame: "advisor",
    strategySupport: true
  }
}
```

### Example 3: Community Quest System

```typescript
// Thing: Quest hierarchy
{
  type: "quest_line",
  name: "Save the Village",
  groupId: gameGuildId,
  properties: {
    problemTypes: ["combat", "social", "puzzle"],
    loopsRequired: 15,
    expectedDuration: 300000,
    dressing: {
      theme: "fantasy",
      narrative: "heroic_journey",
      tone: "adventure"
    }
  }
},
{
  type: "quest",
  name: "Defeat the Goblin King",
  groupId: gameGuildId,
  properties: {
    partOf: questLineId,
    difficulty: 5,
    feedbackElements: {
      combatAnimations: true,
      damageNumbers: true,
      victoryFanfare: true
    }
  }
}

// Connections: Progression gates
{
  type: "requires_completion_of",
  from: questId2,
  to: questId1,
  metadata: {
    unlockCondition: "victory",
    escalationGap: 1  // Next quest is 1 difficulty level higher
  }
}

// Events: Social feedback loop
{
  type: "quest_completed",
  targetId: questId,
  actorId: playerId,
  metadata: {
    completionTime: 45000,
    loopsCompleted: 12,
    masteryDisplayed: "advanced",
    notification: {
      broadcastTo: ["guild_chat", "friends", "leaderboard"]
    }
  }
}
```

---

## Design Checklist for Games in ONE

Before launching a game or gamified experience:

### Phase 1: Foundation
- [ ] Define primary problem type(s) (mathematical, social, physical, or combo)
- [ ] List all constraints (rules, resources, time limits)
- [ ] Define clear win/lose conditions
- [ ] Identify if it's a toy (just rules) or problem (with goals)

### Phase 2: Loops
- [ ] Map the operational loop (perceive → hypothesize → test → learn)
- [ ] Define the progression loop (same actions, varied situations)
- [ ] Show how loops nest and compose into larger systems
- [ ] Create a loop diagram

### Phase 3: Feedback
- [ ] Affordances: Show what actions are available
- [ ] Confirmation: Make actions feel responsive
- [ ] State change: Show how the world changed
- [ ] Evaluation: Make it clear if you succeeded or failed

### Phase 4: Progression
- [ ] Define difficulty curve (sine wave shape)
- [ ] Plan variation escalation (complexity increases over time)
- [ ] Identify break points (where old strategies stop working)
- [ ] Set pacing breathers (recovery moments)

### Phase 5: Psychology
- [ ] Identify target motivation profile(s)
- [ ] Design dressing to match theme
- [ ] Plan narrative/world-building if relevant
- [ ] Consider cultural resonance

### Phase 6: Measurement
- [ ] Define success metrics (completion rate, attempts, time-to-solve)
- [ ] Plan data collection (Events for every action)
- [ ] Set target completion rates (60-90% range is good)
- [ ] Plan feedback loops for iteration

### Phase 7: Scalability
- [ ] Can variations be procedurally generated?
- [ ] How does this scale to 1M players?
- [ ] What happens at different skill levels?
- [ ] Plan difficulty sliders if needed

---

## Common Mistakes

### Mistake 1: No Clear Problem
**Problem:** Just a toy with no goal. Players get bored instantly.
**Solution:** Add a clear, meaningful goal. Make players care about winning.

### Mistake 2: No Feedback
**Problem:** Players can't tell if they're winning or losing.
**Solution:** Implement all four feedback layers (afford, confirm, state, evaluate).

### Mistake 3: No Escalation
**Problem:** Players solve the problem once, then it's boring.
**Solution:** Vary situations as they master them. Add complications.

### Mistake 4: Wrong Pacing
**Problem:** Spikes too hard too fast, or stays easy forever.
**Solution:** Monitor completion rates. Aim for 70-80% on each challenge.

### Mistake 5: Wrong Audience
**Problem:** Building a puzzle game for story lovers.
**Solution:** Understand your audience's motivations upfront.

---

## Integration with ONE Ontology

Games map cleanly to all 6 dimensions:

| Dimension | Game Component | Example |
|-----------|---|---|
| **Groups** | Guilds, clans, leagues | Game universe hierarchy |
| **People** | Players, designers, streamers | Roles in the gaming ecosystem |
| **Things** | Challenges, quests, items, power-ups | All nouns in the game |
| **Connections** | Ownership, relationships, team membership | Who has what, who knows whom |
| **Events** | Every action, score change, achievement | Complete audit trail of gameplay |
| **Knowledge** | Strategies, tutorials, lore | What players learn and discover |

Every game mechanic becomes queryable, analyzable, and connectable to other systems.

---

## Further Reading

- **Raph Koster, "A Theory of Fun for Game Design"** – The foundational work this document is based on
- **Nicole Lazzaro, "Why We Play Games"** – Motivation types
- **Roger Caillois, "Man, Play and Games"** – Problem type categorization
- **Richard Garfield, "Characteristics of Games"** – Problem composition
- **Donovan Cook, "The Fundamentals of Game Design"** – Systems thinking deep dive

---

## Key Takeaway

Games are systems. Systems can be modeled with the 6-dimension ontology. Understanding the 12 principles of game design makes you better at designing any system—games, learning platforms, loyalty programs, or organizational workflows.

The fun is in the learning. The learning is in the problems. The problems are in the loops. Master the loops, and you can build anything.
