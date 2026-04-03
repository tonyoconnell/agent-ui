# SWARMS.md — Dynamic Swarm Formation & Collaboration

> *"One ant finds food. It deposits pheromone. More ants come. A trail forms. A swarm emerges."*

This document defines how agents use pheromones to dynamically form swarms, collaborate on tasks, and dissolve when done.

---

## The Core Insight

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   Traditional Multi-Agent:                                │
│   • Central orchestrator assigns teams                    │
│   • Fixed team composition                                │
│   • Explicit communication channels                       │
│                                                           │
│   Stigmergic Swarms:                                      │
│   • Agent finds big task, deposits RECRUITMENT signal     │
│   • Nearby agents sense it, join if available             │
│   • Swarm forms organically around the task               │
│   • No one assigned the team — it EMERGED                 │
│   • Task completes, swarm dissolves                       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Pheromone Types for Swarm Coordination

```
┌───────────────────────────────────────────────────────────┐
│                    PHEROMONE SIGNALS                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│   TRAIL        │ "I went this way, follow me"             │
│   ─────────────┼──────────────────────────────────────    │
│   Strength:    │ 0-100 (reinforced by success)            │
│   Decay:       │ 5% per cycle                             │
│   Use:         │ Path marking, task sequences             │
│                                                           │
│   ALARM        │ "Danger here, avoid"                     │
│   ─────────────┼──────────────────────────────────────    │
│   Strength:    │ 0-100 (deposited on failure)             │
│   Decay:       │ 20% per cycle (fast forget)              │
│   Use:         │ Failed paths, bad tasks                  │
│                                                           │
│   RECRUITMENT  │ "Help needed here"                       │
│   ─────────────┼──────────────────────────────────────    │
│   Strength:    │ 0-100 (task size / urgency)              │
│   Decay:       │ 10% per cycle                            │
│   Use:         │ Swarm formation, big tasks               │
│                                                           │
│   ASSEMBLY     │ "Swarm forming at this location"         │
│   ─────────────┼──────────────────────────────────────    │
│   Strength:    │ 0-100 (current swarm size)               │
│   Decay:       │ 15% per cycle                            │
│   Use:         │ Join existing swarm                      │
│                                                           │
│   COMPLETION   │ "Task done, disperse"                    │
│   ─────────────┼──────────────────────────────────────    │
│   Strength:    │ Binary (present or not)                  │
│   Decay:       │ 50% per cycle (quick clear)              │
│   Use:         │ Swarm dissolution                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Schema Extension

```typeql
define

# ═══════════════════════════════════════════════════════════
# SWARM ENTITY
# ═══════════════════════════════════════════════════════════

entity swarm,
    owns swarm-id @key,
    owns swarm-purpose,           # "research", "execution", "analysis"
    owns target-task-id,          # The task this swarm is working on
    owns swarm-size,              # Current member count
    owns min-size,                # Minimum agents needed
    owns max-size,                # Maximum agents allowed
    owns formation-time,          # When swarm started forming
    owns activated-time,          # When swarm started working
    owns dissolved-time,          # When swarm finished
    owns swarm-status,            # "forming", "active", "dissolving", "dissolved"
    owns collective-progress,     # 0.0 - 1.0
    plays swarm-membership:the-swarm,
    plays swarm-task:working-swarm;

attribute swarm-id, value string;
attribute swarm-purpose, value string;
attribute target-task-id, value string;
attribute swarm-size, value integer;
attribute min-size, value integer;
attribute max-size, value integer;
attribute formation-time, value datetime;
attribute activated-time, value datetime;
attribute dissolved-time, value datetime;
attribute swarm-status, value string;
attribute collective-progress, value double;

# ═══════════════════════════════════════════════════════════
# SWARM MEMBERSHIP
# ═══════════════════════════════════════════════════════════

relation swarm-membership,
    relates the-swarm,
    relates member-agent,
    owns joined-at,
    owns role-in-swarm,           # "founder", "worker", "specialist"
    owns contribution-share;      # 0.0 - 1.0 (for reward distribution)

agent plays swarm-membership:member-agent;

attribute joined-at, value datetime;
attribute role-in-swarm, value string;
attribute contribution-share, value double;

# ═══════════════════════════════════════════════════════════
# SWARM ↔ TASK RELATION
# ═══════════════════════════════════════════════════════════

relation swarm-task,
    relates working-swarm,
    relates target-task;

task plays swarm-task:target-task;

# ═══════════════════════════════════════════════════════════
# RECRUITMENT PHEROMONE
# ═══════════════════════════════════════════════════════════

entity recruitment-signal,
    owns signal-id @key,
    owns source-agent-id,         # Who sent the signal
    owns source-task-id,          # What task needs help
    owns signal-strength,         # 0-100 (urgency/size)
    owns required-skills,         # Comma-separated skills needed
    owns current-respondents,     # How many have joined
    owns max-respondents,         # How many needed
    owns signal-status,           # "active", "satisfied", "expired"
    owns created-at,
    owns expires-at;

attribute signal-id, value string;
attribute source-agent-id, value string;
attribute source-task-id, value string;
attribute signal-strength, value double;
attribute required-skills, value string;
attribute current-respondents, value integer;
attribute max-respondents, value integer;
attribute signal-status, value string;
attribute expires-at, value datetime;

# ═══════════════════════════════════════════════════════════
# INFERENCE RULES
# ═══════════════════════════════════════════════════════════

# Swarm is ready to activate when minimum size reached
rule swarm-ready-to-activate:
    when {
        $s isa swarm,
            has swarm-status "forming",
            has swarm-size $size,
            has min-size $min;
        $size >= $min;
    } then {
        $s has swarm-status "active";
    };

# Swarm should dissolve when task complete
rule swarm-should-dissolve:
    when {
        $s isa swarm,
            has swarm-status "active",
            has collective-progress $p;
        $p >= 1.0;
    } then {
        $s has swarm-status "dissolving";
    };

# Recruitment signal satisfied when enough respondents
rule recruitment-satisfied:
    when {
        $r isa recruitment-signal,
            has signal-status "active",
            has current-respondents $curr,
            has max-respondents $max;
        $curr >= $max;
    } then {
        $r has signal-status "satisfied";
    };

# ═══════════════════════════════════════════════════════════
# QUERY FUNCTIONS
# ═══════════════════════════════════════════════════════════

# Find active recruitment signals I can respond to
fun available_recruitments($agent_id: string) -> { recruitment-signal }:
    match
        $r isa recruitment-signal,
            has signal-status "active",
            has signal-strength $s;
        $s > 0;
        # Agent not already a respondent (would need more complex check)
    return { $r };

# Find swarms I can join
fun joinable_swarms() -> { swarm }:
    match
        $s isa swarm,
            has swarm-status "forming",
            has swarm-size $size,
            has max-size $max;
        $size < $max;
    return { $s };

# Find active swarms for a task
fun swarms_for_task($task_id: string) -> { swarm }:
    match
        $s isa swarm,
            has target-task-id $task_id,
            has swarm-status $status;
        $status in ["forming", "active"];
    return { $s };

# Get my current swarm
fun my_swarm($agent_id: string) -> { swarm }:
    match
        $a isa agent, has agent-id $agent_id;
        $m (the-swarm: $s, member-agent: $a) isa swarm-membership;
        $s has swarm-status $status;
        $status in ["forming", "active"];
    return { $s };

# Get swarm members
fun swarm_members($swarm_id: string) -> { agent }:
    match
        $s isa swarm, has swarm-id $swarm_id;
        $m (the-swarm: $s, member-agent: $a) isa swarm-membership;
    return { $a };

# Get strongest recruitment signals
fun urgent_recruitments() -> { recruitment-signal }:
    match
        $r isa recruitment-signal,
            has signal-status "active",
            has signal-strength $s;
        $s >= 50.0;
    return { $r };
```

---

## Swarm Lifecycle

```
┌───────────────────────────────────────────────────────────┐
│                     SWARM LIFECYCLE                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│   1. DETECTION                                            │
│      Agent finds task too big for one                     │
│      └── task.estimated_effort > agent.capacity           │
│                                                           │
│          ▼                                                │
│                                                           │
│   2. RECRUITMENT                                          │
│      Agent deposits recruitment pheromone                 │
│      └── signal_strength = task.size * urgency            │
│      └── required_skills = task.skill_requirements        │
│                                                           │
│          ▼                                                │
│                                                           │
│   3. FORMATION                                            │
│      Other agents sense recruitment                       │
│      └── if available AND has skills: respond             │
│      └── swarm-membership created                         │
│      └── swarm-size increments                            │
│                                                           │
│          ▼                                                │
│                                                           │
│   4. ACTIVATION                                           │
│      Min size reached → swarm activates                   │
│      └── RULE: swarm-ready-to-activate fires              │
│      └── status: "forming" → "active"                     │
│                                                           │
│          ▼                                                │
│                                                           │
│   5. COLLABORATION                                        │
│      Members work on subtasks in parallel                 │
│      └── Each agent: pick subtask, execute, update        │
│      └── collective-progress aggregates                   │
│      └── Internal pheromones coordinate                   │
│                                                           │
│          ▼                                                │
│                                                           │
│   6. COMPLETION                                           │
│      Progress reaches 100%                                │
│      └── RULE: swarm-should-dissolve fires                │
│      └── status: "active" → "dissolving"                  │
│                                                           │
│          ▼                                                │
│                                                           │
│   7. DISSOLUTION                                          │
│      Rewards distributed by contribution-share            │
│      └── Members released back to pool                    │
│      └── status: "dissolving" → "dissolved"               │
│      └── Trail pheromone deposited (success record)       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Swarm Formation Algorithm

```python
class SwarmFormation:
    """Pheromone-based swarm formation."""

    async def agent_tick(self, agent: Agent):
        """One tick of swarm-aware agent behavior."""

        # Check if already in a swarm
        my_swarm = await query(f"match let $s in my_swarm('{agent.id}'); ...")
        if my_swarm:
            return await self.collaborate_in_swarm(agent, my_swarm)

        # Check for recruitment signals
        recruitments = await query("match let $r in urgent_recruitments(); ...")

        for signal in recruitments:
            if self.should_respond(agent, signal):
                return await self.join_swarm(agent, signal)

        # Check if my current task needs a swarm
        if agent.current_task:
            if self.task_needs_swarm(agent.current_task, agent):
                return await self.initiate_swarm(agent)

        # Normal solo behavior
        return await self.solo_work(agent)

    def should_respond(self, agent: Agent, signal: RecruitmentSignal) -> bool:
        """Probabilistic decision to respond to recruitment."""

        # Base probability from signal strength
        base_prob = signal.strength / 100.0

        # Adjust for skill match
        skill_match = self.calculate_skill_match(agent, signal.required_skills)

        # Adjust for agent's current state
        availability = 1.0 if not agent.current_task else 0.3

        # Probabilistic response (like pheromone following)
        probability = base_prob * skill_match * availability
        return random.random() < probability

    def task_needs_swarm(self, task: Task, agent: Agent) -> bool:
        """Determine if task requires swarm."""
        return task.estimated_effort > agent.capacity * 2

    async def initiate_swarm(self, agent: Agent):
        """Agent initiates swarm formation."""

        # Create recruitment signal
        signal_strength = min(100, agent.current_task.effort / 10)
        await query(f"""
            insert $r isa recruitment-signal,
                has signal-id "{uuid4()}",
                has source-agent-id "{agent.id}",
                has source-task-id "{agent.current_task.id}",
                has signal-strength {signal_strength},
                has required-skills "{agent.current_task.skills}",
                has current-respondents 1,
                has max-respondents {self.estimate_swarm_size(agent.current_task)},
                has signal-status "active",
                has created-at {now()};
        """)

        # Create swarm entity
        swarm_id = str(uuid4())
        await query(f"""
            insert $s isa swarm,
                has swarm-id "{swarm_id}",
                has swarm-purpose "task-execution",
                has target-task-id "{agent.current_task.id}",
                has swarm-size 1,
                has min-size 3,
                has max-size 10,
                has swarm-status "forming",
                has collective-progress 0.0,
                has formation-time {now()};
        """)

        # Add self as founder
        await query(f"""
            match
                $s isa swarm, has swarm-id "{swarm_id}";
                $a isa agent, has agent-id "{agent.id}";
            insert
                $m (the-swarm: $s, member-agent: $a) isa swarm-membership,
                    has joined-at {now()},
                    has role-in-swarm "founder",
                    has contribution-share 0.0;
        """)

    async def join_swarm(self, agent: Agent, signal: RecruitmentSignal):
        """Agent joins an existing swarm."""

        # Find the swarm for this signal
        swarm = await query(f"""
            match $s isa swarm, has target-task-id "{signal.source_task_id}";
            select $s;
        """)

        # Add self as member
        await query(f"""
            match
                $s isa swarm, has swarm-id "{swarm.id}";
                $a isa agent, has agent-id "{agent.id}";
            insert
                $m (the-swarm: $s, member-agent: $a) isa swarm-membership,
                    has joined-at {now()},
                    has role-in-swarm "worker",
                    has contribution-share 0.0;
        """)

        # Update swarm size
        await query(f"""
            match
                $s isa swarm, has swarm-id "{swarm.id}", has swarm-size $old;
                let $new = $old + 1;
            delete $old of $s;
            insert $s has swarm-size $new;
        """)

        # Update signal respondents
        await query(f"""
            match
                $r isa recruitment-signal,
                    has signal-id "{signal.id}",
                    has current-respondents $old;
                let $new = $old + 1;
            delete $old of $r;
            insert $r has current-respondents $new;
        """)
```

---

## Collaboration Patterns

### Pattern 1: Parallel Decomposition

```
┌───────────────────────────────────────────────────────────┐
│                PARALLEL DECOMPOSITION                     │
│                                                           │
│   Big Task                                                │
│      │                                                    │
│      ├──► Subtask A ──► Agent 1 ──┐                       │
│      │                            │                       │
│      ├──► Subtask B ──► Agent 2 ──┼──► Merge ──► Done     │
│      │                            │                       │
│      └──► Subtask C ──► Agent 3 ──┘                       │
│                                                           │
│   Each agent works independently                          │
│   Results merged at completion                            │
│   Fastest pattern for parallelizable work                 │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Pattern 2: Pipeline

```
┌───────────────────────────────────────────────────────────┐
│                      PIPELINE                             │
│                                                           │
│   Agent 1        Agent 2        Agent 3                   │
│   (Extract)  ──► (Transform) ──► (Load)                   │
│                                                           │
│   Internal pheromone trail:                               │
│   stage-1 ═══► stage-2 ═══► stage-3                       │
│                                                           │
│   Each agent specializes in one stage                     │
│   Work flows through the pipeline                         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Pattern 3: Leader-Follower

```
┌───────────────────────────────────────────────────────────┐
│                   LEADER-FOLLOWER                         │
│                                                           │
│            ┌─────────┐                                    │
│            │ Leader  │ (founder agent)                    │
│            │ Agent 1 │                                    │
│            └────┬────┘                                    │
│                 │ deposits pheromones                     │
│       ┌─────────┼─────────┐                               │
│       ▼         ▼         ▼                               │
│   ┌───────┐ ┌───────┐ ┌───────┐                           │
│   │ Fol 2 │ │ Fol 3 │ │ Fol 4 │                           │
│   └───────┘ └───────┘ └───────┘                           │
│                                                           │
│   Leader makes decisions, deposits trails                 │
│   Followers execute, reinforce or alarm                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Pattern 4: Consensus

```
┌───────────────────────────────────────────────────────────┐
│                     CONSENSUS                             │
│                                                           │
│   Decision needed: "Which approach to use?"               │
│                                                           │
│   Agent 1: votes A ──┐                                    │
│   Agent 2: votes A ──┼──► A wins (pheromone strength)     │
│   Agent 3: votes B ──┤                                    │
│   Agent 4: votes A ──┘                                    │
│                                                           │
│   Each vote = pheromone deposit                           │
│   Strongest signal = consensus                            │
│   No explicit voting protocol                             │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Internal Swarm Pheromones

```
┌───────────────────────────────────────────────────────────┐
│              INTRA-SWARM PHEROMONES                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│   PROGRESS      │ "I completed this subtask"              │
│   ─────────────┼──────────────────────────────────────    │
│   Deposited:   │ On subtask completion                    │
│   Effect:      │ Updates collective-progress              │
│   Visible to:  │ All swarm members                        │
│                                                           │
│   HANDOFF      │ "Ready for next stage"                   │
│   ─────────────┼──────────────────────────────────────    │
│   Deposited:   │ Pipeline stage complete                  │
│   Effect:      │ Triggers next agent                      │
│   Visible to:  │ Next stage agent                         │
│                                                           │
│   BLOCKED      │ "I'm stuck, need help"                   │
│   ─────────────┼──────────────────────────────────────    │
│   Deposited:   │ Agent encounters obstacle                │
│   Effect:      │ Attracts specialist or redistributes     │
│   Visible to:  │ All swarm members                        │
│                                                           │
│   PROPOSAL     │ "I suggest this approach"                │
│   ─────────────┼──────────────────────────────────────    │
│   Deposited:   │ Agent has idea                           │
│   Effect:      │ Others can reinforce or counter          │
│   Visible to:  │ All swarm members                        │
│                                                           │
│   AGREEMENT    │ "I support this proposal"                │
│   ─────────────┼──────────────────────────────────────    │
│   Deposited:   │ On proposal an agent agrees with         │
│   Effect:      │ Strengthens proposal signal              │
│   Visible to:  │ All swarm members                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Credit Attribution

```python
async def distribute_rewards(swarm_id: str, total_reward: float):
    """Distribute rewards to swarm members by contribution."""

    # Get all members with their shares
    members = await query(f"""
        match
            $s isa swarm, has swarm-id "{swarm_id}";
            $m (the-swarm: $s, member-agent: $a) isa swarm-membership,
                has contribution-share $share,
                has role-in-swarm $role;
            $a has agent-id $id;
        select $id, $share, $role;
    """)

    # Calculate shares
    total_share = sum(m.share for m in members)

    for member in members:
        # Base share from contribution
        agent_reward = total_reward * (member.share / total_share)

        # Bonus for founder (took initiative)
        if member.role == "founder":
            agent_reward *= 1.2

        # Update agent's contribution
        await query(f"""
            match
                $a isa agent, has agent-id "{member.id}",
                    has total-contribution $old;
                let $new = $old + {agent_reward};
            delete $old of $a;
            insert $a has total-contribution $new;
        """)

        # Deposit success trail (swarm worked well)
        await reinforce_trail(
            from_entity=swarm_id,
            to_entity=member.id,
            amount=agent_reward / 10
        )
```

---

## Swarm Intelligence Patterns

### Emergent Specialization

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   Over time, agents SPECIALIZE within swarms:             │
│                                                           │
│   Agent A: Always joins research swarms                   │
│            → Becomes "research specialist"                │
│            → Higher contribution share in research        │
│            → More likely recruited for research           │
│                                                           │
│   Agent B: Always does execution in pipelines             │
│            → Becomes "executor"                           │
│            → Faster at execution subtasks                 │
│            → Preferred for execution roles                │
│                                                           │
│   No one assigned these roles.                            │
│   Specialization EMERGED from pheromone feedback.         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Swarm Memory

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   Swarm completes task successfully                       │
│       │                                                   │
│       ▼                                                   │
│   Pheromone trail deposited:                              │
│   [task-type: research] ═══► [swarm-pattern: parallel]    │
│       │                                                   │
│       ▼                                                   │
│   Next similar task:                                      │
│   Agent queries: "What worked for research tasks?"        │
│   Finds: strong trail to parallel pattern                 │
│   Uses: parallel decomposition                            │
│                                                           │
│   The colony REMEMBERS what swarm patterns work           │
│   for what task types — without explicit storage          │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Example: Research Swarm

```python
async def research_task_example():
    """Example: Agents form swarm to research a topic."""

    # Task: Research "competitor analysis"
    task = await create_task(
        title="Competitor Analysis",
        description="Analyze top 10 competitors",
        estimated_effort=100,  # Too big for one agent
        skills=["web_search", "analysis", "summarization"]
    )

    # Agent 1 finds the task
    agent1 = await get_available_agent()
    agent1.current_task = task

    # Agent 1 realizes it's too big, initiates swarm
    await swarm_formation.initiate_swarm(agent1)
    # → Recruitment pheromone deposited (strength: 50)
    # → Swarm created (status: forming, min: 3, max: 8)

    # Other agents sense recruitment
    for _ in range(100):  # Tick loop
        for agent in agents:
            # Probabilistic response to recruitment
            recruitments = await query("match let $r in urgent_recruitments();")
            for r in recruitments:
                if swarm_formation.should_respond(agent, r):
                    await swarm_formation.join_swarm(agent, r)

    # Swarm reaches min size → activates
    # RULE: swarm-ready-to-activate fires

    # Collaboration phase
    swarm = await query("match $s has swarm-status 'active'; select $s;")
    subtasks = decompose_task(task, num_subtasks=len(swarm.members))

    for tick in range(1000):
        for member in swarm.members:
            subtask = await pick_available_subtask(member, subtasks)
            result = await member.execute(subtask)

            if result.success:
                # Update progress
                await increment_progress(swarm, 1/len(subtasks))
                # Deposit internal progress pheromone
                await deposit_progress_signal(swarm, member, subtask)
            else:
                # Deposit blocked signal for help
                await deposit_blocked_signal(swarm, member, subtask)

        # Check if done
        if swarm.collective_progress >= 1.0:
            break

    # Completion
    # RULE: swarm-should-dissolve fires

    # Distribute rewards
    await distribute_rewards(swarm.id, task.reward)

    # Dissolve
    await dissolve_swarm(swarm.id)
    # → Members released
    # → Success trail deposited
    # → Swarm memory preserved
```

---

## Metrics & Experiments

### Swarm Efficiency Experiment

```
Setup:
- 100 tasks of varying size (1-100 effort)
- 50 agents
- Compare: solo vs stigmergic swarms

Measure:
- Time to complete all tasks
- Agent utilization
- Task failure rate

Expected:
- Swarms complete big tasks faster
- Better utilization (less idle time)
- Lower failure rate (collective problem-solving)
```

### Swarm Size Optimization

```
Setup:
- Fixed task size (effort = 50)
- Vary min/max swarm parameters
- Measure efficiency

Expected:
- Optimal swarm size emerges
- Too small = slow
- Too big = coordination overhead
- Sweet spot ≈ √(task_effort)
```

---

## The Thesis

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   Swarms don't need to be ASSIGNED.                       │
│   They can EMERGE from pheromone signals.                 │
│                                                           │
│   1. Agent finds big task                                 │
│   2. Deposits recruitment pheromone                       │
│   3. Others sense and respond                             │
│   4. Swarm forms organically                              │
│   5. Work collaboratively                                 │
│   6. Dissolve when done                                   │
│                                                           │
│   No orchestrator. No assignment. No protocol.            │
│   Just pheromones and simple rules.                       │
│                                                           │
│   SWARMS EMERGE.                                          │
│                                                           │
└───────────────────────────────────────────────────────────┘
```
