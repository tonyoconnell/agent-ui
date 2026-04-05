# SWARMS.md — Dynamic Swarm Formation & Collaboration

> *"One ant finds food. It deposits pheromone. More ants come. A trail forms. A swarm emerges."*

This document defines how agents use pheromones to dynamically form groups, collaborate on tasks, and dissolve when done.

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
│   • Task completes, group dissolves                       │
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
│   Strength:    │ 0-100 (current group size)               │
│   Decay:       │ 15% per cycle                            │
│   Use:         │ Join existing group                      │
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

entity group,
    owns group-id @key,
    owns group-purpose,           # "research", "execution", "analysis"
    owns target-task-id,          # The task this group is working on
    owns group-size,              # Current member count
    owns min-size,                # Minimum agents needed
    owns max-size,                # Maximum agents allowed
    owns formation-time,          # When group started forming
    owns activated-time,          # When group started working
    owns dissolved-time,          # When group finished
    owns group-status,            # "forming", "active", "dissolving", "dissolved"
    owns collective-progress,     # 0.0 - 1.0
    plays group-membership:the-group,
    plays group-task:working-group;

attribute group-id, value string;
attribute group-purpose, value string;
attribute target-task-id, value string;
attribute group-size, value integer;
attribute min-size, value integer;
attribute max-size, value integer;
attribute formation-time, value datetime;
attribute activated-time, value datetime;
attribute dissolved-time, value datetime;
attribute group-status, value string;
attribute collective-progress, value double;

# ═══════════════════════════════════════════════════════════
# GROUP MEMBERSHIP
# ═══════════════════════════════════════════════════════════

relation group-membership,
    relates the-group,
    relates member-agent,
    owns joined-at,
    owns role-in-group,           # "founder", "worker", "specialist"
    owns contribution-share;      # 0.0 - 1.0 (for reward distribution)

agent plays group-membership:member-agent;

attribute joined-at, value datetime;
attribute role-in-group, value string;
attribute contribution-share, value double;

# ═══════════════════════════════════════════════════════════
# GROUP ↔ TASK RELATION
# ═══════════════════════════════════════════════════════════

relation group-task,
    relates working-group,
    relates target-task;

task plays group-task:target-task;

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

# Group is ready to activate when minimum size reached
rule group-ready-to-activate:
    when {
        $g isa group,
            has group-status "forming",
            has group-size $size,
            has min-size $min;
        $size >= $min;
    } then {
        $g has group-status "active";
    };

# Group should dissolve when task complete
rule group-should-dissolve:
    when {
        $g isa group,
            has group-status "active",
            has collective-progress $p;
        $p >= 1.0;
    } then {
        $g has group-status "dissolving";
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

# Find groups I can join
fun joinable_groups() -> { group }:
    match
        $g isa group,
            has group-status "forming",
            has group-size $size,
            has max-size $max;
        $size < $max;
    return { $g };

# Find active groups for a task
fun groups_for_task($task_id: string) -> { group }:
    match
        $g isa group,
            has target-task-id $task_id,
            has group-status $status;
        $status in ["forming", "active"];
    return { $g };

# Get my current group
fun my_group($agent_id: string) -> { group }:
    match
        $a isa agent, has agent-id $agent_id;
        $m (the-group: $g, member-agent: $a) isa group-membership;
        $g has group-status $status;
        $status in ["forming", "active"];
    return { $g };

# Get group members
fun group_members($group_id: string) -> { agent }:
    match
        $g isa group, has group-id $group_id;
        $m (the-group: $g, member-agent: $a) isa group-membership;
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
│      └── group-membership created                         │
│      └── group-size increments                            │
│                                                           │
│          ▼                                                │
│                                                           │
│   4. ACTIVATION                                           │
│      Min size reached → group activates                   │
│      └── RULE: group-ready-to-activate fires              │
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
│      └── RULE: group-should-dissolve fires                │
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
class GroupFormation:
    """Pheromone-based group formation."""

    async def agent_tick(self, agent: Agent):
        """One tick of group-aware agent behavior."""

        # Check if already in a group
        my_group = await query(f"match let $g in my_group('{agent.id}'); ...")
        if my_group:
            return await self.collaborate_in_group(agent, my_group)

        # Check for recruitment signals
        recruitments = await query("match let $r in urgent_recruitments(); ...")

        for signal in recruitments:
            if self.should_respond(agent, signal):
                return await self.join_group(agent, signal)

        # Check if my current task needs a group
        if agent.current_task:
            if self.task_needs_group(agent.current_task, agent):
                return await self.initiate_group(agent)

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

    def task_needs_group(self, task: Task, agent: Agent) -> bool:
        """Determine if task requires group."""
        return task.estimated_effort > agent.capacity * 2

    async def initiate_group(self, agent: Agent):
        """Agent initiates group formation."""

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
                has max-respondents {self.estimate_group_size(agent.current_task)},
                has signal-status "active",
                has created-at {now()};
        """)

        # Create group entity
        group_id = str(uuid4())
        await query(f"""
            insert $g isa group,
                has group-id "{group_id}",
                has group-purpose "task-execution",
                has target-task-id "{agent.current_task.id}",
                has group-size 1,
                has min-size 3,
                has max-size 10,
                has group-status "forming",
                has collective-progress 0.0,
                has formation-time {now()};
        """)

        # Add self as founder
        await query(f"""
            match
                $g isa group, has group-id "{group_id}";
                $a isa agent, has agent-id "{agent.id}";
            insert
                $m (the-group: $g, member-agent: $a) isa group-membership,
                    has joined-at {now()},
                    has role-in-group "founder",
                    has contribution-share 0.0;
        """)

    async def join_group(self, agent: Agent, signal: RecruitmentSignal):
        """Agent joins an existing group."""

        # Find the group for this signal
        group = await query(f"""
            match $g isa group, has target-task-id "{signal.source_task_id}";
            select $g;
        """)

        # Add self as member
        await query(f"""
            match
                $g isa group, has group-id "{group.id}";
                $a isa agent, has agent-id "{agent.id}";
            insert
                $m (the-group: $g, member-agent: $a) isa group-membership,
                    has joined-at {now()},
                    has role-in-group "worker",
                    has contribution-share 0.0;
        """)

        # Update group size
        await query(f"""
            match
                $g isa group, has group-id "{group.id}", has group-size $old;
                let $new = $old + 1;
            delete $old of $g;
            insert $g has group-size $new;
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
│   Visible to:  │ All group members                        │
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
│   Visible to:  │ All group members                        │
│                                                           │
│   PROPOSAL     │ "I suggest this approach"                │
│   ─────────────┼──────────────────────────────────────    │
│   Deposited:   │ Agent has idea                           │
│   Effect:      │ Others can reinforce or counter          │
│   Visible to:  │ All group members                        │
│                                                           │
│   AGREEMENT    │ "I support this proposal"                │
│   ─────────────┼──────────────────────────────────────    │
│   Deposited:   │ On proposal an agent agrees with         │
│   Effect:      │ Strengthens proposal signal              │
│   Visible to:  │ All group members                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Credit Attribution

```python
async def distribute_rewards(group_id: str, total_reward: float):
    """Distribute rewards to group members by contribution."""

    # Get all members with their shares
    members = await query(f"""
        match
            $g isa group, has group-id "{group_id}";
            $m (the-group: $g, member-agent: $a) isa group-membership,
                has contribution-share $share,
                has role-in-group $role;
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

        # Deposit success trail (group worked well)
        await reinforce_trail(
            from_entity=group_id,
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
│   Over time, agents SPECIALIZE within groups:             │
│                                                           │
│   Agent A: Always joins research groups                   │
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
│   Group completes task successfully                       │
│       │                                                   │
│       ▼                                                   │
│   Pheromone trail deposited:                              │
│   [task-type: research] ═══► [group-pattern: parallel]    │
│       │                                                   │
│       ▼                                                   │
│   Next similar task:                                      │
│   Agent queries: "What worked for research tasks?"        │
│   Finds: strong trail to parallel pattern                 │
│   Uses: parallel decomposition                            │
│                                                           │
│   The colony REMEMBERS what group patterns work           │
│   for what task types — without explicit storage          │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Example: Research Swarm

```python
async def research_task_example():
    """Example: Agents form group to research a topic."""

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

    # Agent 1 realizes it's too big, initiates group
    await group_formation.initiate_group(agent1)
    # → Recruitment pheromone deposited (strength: 50)
    # → Group created (status: forming, min: 3, max: 8)

    # Other agents sense recruitment
    for _ in range(100):  # Tick loop
        for agent in agents:
            # Probabilistic response to recruitment
            recruitments = await query("match let $r in urgent_recruitments();")
            for r in recruitments:
                if group_formation.should_respond(agent, r):
                    await group_formation.join_group(agent, r)

    # Group reaches min size → activates
    # RULE: group-ready-to-activate fires

    # Collaboration phase
    group = await query("match $g has group-status 'active'; select $g;")
    subtasks = decompose_task(task, num_subtasks=len(group.members))

    for tick in range(1000):
        for member in group.members:
            subtask = await pick_available_subtask(member, subtasks)
            result = await member.execute(subtask)

            if result.success:
                # Update progress
                await increment_progress(group, 1/len(subtasks))
                # Deposit internal progress pheromone
                await deposit_progress_signal(group, member, subtask)
            else:
                # Deposit blocked signal for help
                await deposit_blocked_signal(group, member, subtask)

        # Check if done
        if group.collective_progress >= 1.0:
            break

    # Completion
    # RULE: group-should-dissolve fires

    # Distribute rewards
    await distribute_rewards(group.id, task.reward)

    # Dissolve
    await dissolve_group(group.id)
    # → Members released
    # → Success trail deposited
    # → Group memory preserved
```

---

## Metrics & Experiments

### Swarm Efficiency Experiment

```
Setup:
- 100 tasks of varying size (1-100 effort)
- 50 agents
- Compare: solo vs stigmergic groups

Measure:
- Time to complete all tasks
- Agent utilization
- Task failure rate

Expected:
- Groups complete big tasks faster
- Better utilization (less idle time)
- Lower failure rate (collective problem-solving)
```

### Group Size Optimization

```
Setup:
- Fixed task size (effort = 50)
- Vary min/max group parameters
- Measure efficiency

Expected:
- Optimal group size emerges
- Too small = slow
- Too big = coordination overhead
- Sweet spot ≈ √(task_effort)
```

---

## The Thesis

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   Groups don't need to be ASSIGNED.                       │
│   They can EMERGE from pheromone signals.                 │
│                                                           │
│   1. Agent finds big task                                 │
│   2. Deposits recruitment pheromone                       │
│   3. Others sense and respond                             │
│   4. Group forms organically                              │
│   5. Work collaboratively                                 │
│   6. Dissolve when done                                   │
│                                                           │
│   No orchestrator. No assignment. No protocol.            │
│   Just pheromones and simple rules.                       │
│                                                           │
│   GROUPS EMERGE.                                          │
│                                                           │
└───────────────────────────────────────────────────────────┘
```
