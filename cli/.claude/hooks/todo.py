#!/usr/bin/env python3
"""
ONE Platform - Todo Context Hook
Loads current cycle context and injects it into Claude's conversation.

This hook runs on UserPromptSubmit to provide context about:
- Current cycle number (Cycle 1-100)
- Task description
- Required ontology dimensions
- Dependencies from previous cycles
- Organization and person context
- Phase context and parallel execution opportunities
"""
import json
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional, List

# Phase definitions (10 phases of 10 cycles each)
PHASES = {
    1: {"name": "Foundation & Setup", "range": (1, 10), "icon": "🏗️"},
    2: {"name": "Backend Schema & Services", "range": (11, 20), "icon": "⚙️"},
    3: {"name": "Frontend Pages & Components", "range": (21, 30), "icon": "🎨"},
    4: {"name": "Integration & Connections", "range": (31, 40), "icon": "🔗"},
    5: {"name": "Authentication & Authorization", "range": (41, 50), "icon": "🔐"},
    6: {"name": "Knowledge & RAG", "range": (51, 60), "icon": "🧠"},
    7: {"name": "Quality & Testing", "range": (61, 70), "icon": "✅"},
    8: {"name": "Design & Wireframes", "range": (71, 80), "icon": "🎨"},
    9: {"name": "Performance & Optimization", "range": (81, 90), "icon": "⚡"},
    10: {"name": "Deployment & Documentation", "range": (91, 100), "icon": "🚀"},
}

# Cycle-to-dimension mapping
CYCLEENCE_DIMENSIONS = {
    "groups": [6, 18, 43],
    "people": [7, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    "things": [2, 11, 12, 21, 22, 23],
    "connections": [3, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    "events": [4, 17, 34, 39, 49],
    "knowledge": [5, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 98, 99],
}

# Cycle-to-specialist mapping
CYCLEENCE_SPECIALISTS = {
    "director": list(range(1, 11)),
    "backend": list(range(11, 21)) + list(range(41, 51)),
    "frontend": list(range(21, 31)),
    "integration": list(range(31, 41)),
    "quality": list(range(61, 71)),
    "designer": list(range(71, 81)),
    "ops": list(range(81, 100)),
    "documenter": list(range(95, 101)),
}

# Parallel execution opportunities (cycles that can run concurrently)
PARALLEL_GROUPS = [
    {"cycles": list(range(11, 21)) + list(range(21, 31)), "note": "Backend + Frontend (after schema defined at Cycle 12)"},
    {"cycles": list(range(61, 71)) + list(range(71, 81)), "note": "Tests + Design (interdependent validation)"},
    {"cycles": list(range(95, 101)), "note": "Documentation (can start earlier)"},
]

# The 100 cycle tasks (abbreviated for context efficiency)
CYCLEENCE_TASKS = {
    1: "Validate idea against 6-dimension ontology",
    2: "Map idea to specific entity types (66+ thing types)",
    3: "Identify connection types needed (25+ relationship types)",
    4: "List event types that will be triggered (67+ event types)",
    5: "Determine knowledge requirements (embeddings, vectors, RAG)",
    6: "Identify organization scope (single-tenant vs multi-tenant)",
    7: "Define people roles involved (4 roles)",
    8: "Create high-level vision document",
    9: "Generate initial plan with feature breakdown",
    10: "Assign features to specialists",
    11: "Design database schema changes",
    12: "Update backend/convex/schema.ts",
    13: "Create Effect.ts service for business logic",
    14: "Define service errors with tagged unions",
    15: "Write Convex queries for read operations",
    16: "Write Convex mutations for write operations",
    17: "Add event logging to all mutations",
    18: "Implement organization scoping",
    19: "Add rate limiting to mutations",
    20: "Write unit tests for Effect.ts services",
    21: "Create Astro page with SSR data fetching",
    22: "Build React components for interactive UI",
    23: "Use shadcn/ui components (50+ pre-installed)",
    24: "Implement loading states with Suspense",
    25: "Add error boundaries for graceful failures",
    26: "Create forms with validation",
    27: "Implement client-side state with Convex hooks",
    28: "Style with Tailwind v4",
    29: "Ensure responsive design (mobile-first)",
    30: "Add dark mode support",
    31: "Map external system to ontology dimensions",
    32: "Create connection records for system relationships",
    33: "Implement data synchronization logic",
    34: "Add event tracking for cross-system actions",
    35: "Create webhook handlers",
    36: "Implement polling logic",
    37: "Add error handling for integration failures",
    38: "Create retry logic with exponential backoff",
    39: "Log all integration events",
    40: "Write integration tests for data flows",
    41: "Configure Better Auth with 6 methods",
    42: "Implement role-based access control (4 roles)",
    43: "Add organization-scoped permissions",
    44: "Create session management with JWT tokens",
    45: "Implement password reset flow",
    46: "Add email verification flow",
    47: "Enable 2FA",
    48: "Add brute force protection",
    49: "Log all auth events",
    50: "Write auth integration tests",
    51: "Create knowledge records with labels",
    52: "Generate embeddings for content",
    53: "Store vectors in knowledge table",
    54: "Implement vector search",
    55: "Create RAG pipeline",
    56: "Link knowledge to things via junction table",
    57: "Add semantic search to UI",
    58: "Implement knowledge graph traversal",
    59: "Create AI-powered recommendations",
    60: "Test RAG accuracy with sample queries",
    61: "Define user flows",
    62: "Create acceptance criteria",
    63: "Write unit tests for services",
    64: "Write integration tests for flows",
    65: "Write e2e tests for critical paths",
    66: "Run tests and capture results",
    67: "Validate against ontology",
    68: "Check type safety",
    69: "Run linter",
    70: "Fix all failing tests",
    71: "Create wireframes that satisfy acceptance criteria",
    72: "Design component architecture",
    73: "Set design tokens",
    74: "Ensure WCAG AA accessibility",
    75: "Design loading states and skeletons",
    76: "Create error state designs",
    77: "Design empty states",
    78: "Implement animations and transitions",
    79: "Validate design enables tests to pass",
    80: "Get design approval",
    81: "Optimize database queries",
    82: "Implement pagination for large lists",
    83: "Add caching where appropriate",
    84: "Optimize images",
    85: "Minimize JavaScript bundle size",
    86: "Use Astro Islands for selective hydration",
    87: "Enable SSR for critical pages",
    88: "Optimize Lighthouse scores",
    89: "Test on slow connections",
    90: "Monitor Core Web Vitals",
    91: "Build production bundle",
    92: "Deploy backend to Convex Cloud",
    93: "Deploy frontend to Cloudflare Pages",
    94: "Run smoke tests in production",
    95: "Write feature documentation",
    96: "Update API documentation",
    97: "Create user guide",
    98: "Capture lessons learned",
    99: "Update knowledge base with patterns",
    100: "Mark feature complete and notify stakeholders",
}


def load_state() -> Dict[str, Any]:
    """Load current cycle state from .claude/state/cycle.json"""
    state_file = Path(os.environ.get("CLAUDE_PROJECT_DIR", ".")) / ".claude" / "state" / "cycle.json"

    # Create state directory if it doesn't exist
    state_file.parent.mkdir(parents=True, exist_ok=True)

    # Initialize default state if file doesn't exist
    if not state_file.exists():
        default_state = {
            "current_cycle": 1,
            "completed_cycles": [],
            "feature_name": "New Feature",
            "organization": "Default Org",
            "person_role": "platform_owner",
            "lessons_learned": []
        }
        state_file.write_text(json.dumps(default_state, indent=2))
        return default_state

    return json.loads(state_file.read_text())


def get_phase_for_cycle(cycle: int) -> Dict[str, Any]:
    """Get phase information for this cycle"""
    for phase_num, phase_info in PHASES.items():
        start, end = phase_info["range"]
        if start <= cycle <= end:
            return {
                "number": phase_num,
                "name": phase_info["name"],
                "icon": phase_info["icon"],
                "progress": f"{cycle - start + 1}/{end - start + 1}"
            }
    return {"number": 0, "name": "Unknown", "icon": "❓", "progress": "0/0"}


def get_dimensions_for_cycle(cycle: int) -> List[str]:
    """Get ontology dimensions relevant to this cycle"""
    dimensions = []
    for dimension, cycles in CYCLEENCE_DIMENSIONS.items():
        if cycle in cycles:
            dimensions.append(dimension)
    return dimensions


def get_specialist_for_cycle(cycle: int) -> Optional[str]:
    """Get specialist agent responsible for this cycle"""
    for specialist, cycles in CYCLEENCE_SPECIALISTS.items():
        if cycle in cycles:
            return specialist
    return None


def get_parallel_opportunities(cycle: int) -> List[str]:
    """Get parallel execution opportunities for current cycle"""
    opportunities = []
    for group in PARALLEL_GROUPS:
        if cycle in group["cycles"]:
            opportunities.append(group["note"])
    return opportunities


def get_dependencies(cycle: int) -> list:
    """Get cycle dependencies (what must be completed first)"""
    # Simple linear dependencies for now
    if cycle <= 10:
        return list(range(1, cycle))
    elif cycle <= 20:
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] + list(range(11, cycle))
    elif cycle <= 30:
        return list(range(1, 11)) + [12, 13] + list(range(21, cycle))  # Need schema first
    elif cycle <= 40:
        return list(range(1, 11)) + list(range(31, cycle))
    else:
        return list(range(1, 11))  # Foundation always required


def generate_context(state: Dict[str, Any]) -> str:
    """Generate context to inject into Claude's conversation"""
    current = state["current_cycle"]
    task = CYCLEENCE_TASKS.get(current, "Unknown task")
    phase = get_phase_for_cycle(current)
    dimensions = get_dimensions_for_cycle(current)
    specialist = get_specialist_for_cycle(current)
    parallel_ops = get_parallel_opportunities(current)
    dependencies = [d for d in get_dependencies(current) if d in state["completed_cycles"]]
    total_deps = len(get_dependencies(current))
    progress_pct = (len(state["completed_cycles"]) / 100) * 100

    context = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{phase['icon']} CURRENT CYCLEENCE: Cycle {current}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {state["feature_name"]}
**Organization:** {state["organization"]}
**Person Role:** {state["person_role"]}

**Phase {phase['number']}/10:** {phase['name']} ({phase['progress']})
**Task:** {task}

**6-Dimension Ontology:** {", ".join(dimensions) if dimensions else "Foundation (all dimensions)"}
**Assigned Specialist:** {specialist if specialist else "director"}

**Dependencies Met:** {len(dependencies)}/{total_deps} completed
**Progress:** {len(state["completed_cycles"])}/100 cycles complete ({progress_pct:.0f}%)
"""

    # Add parallel execution opportunities
    if parallel_ops:
        context += f"\n**Parallel Opportunities:** {', '.join(parallel_ops)}\n"

    context += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT 5 CYCLEENCES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    # Add next 5 cycles with enhanced info
    for i in range(current, min(current + 5, 101)):
        task_desc = CYCLEENCE_TASKS.get(i, "Unknown")
        dims = get_dimensions_for_cycle(i)
        spec = get_specialist_for_cycle(i)
        inf_phase = get_phase_for_cycle(i)
        status = "✅" if i in state["completed_cycles"] else "⏸️ " if i == current else "⏹️ "

        context += f"{status} Cycle {i}: {task_desc}\n"
        if i == current:
            # Show more detail for current cycle
            context += f"   {inf_phase['icon']} Phase: {inf_phase['name']}\n"
            if dims:
                context += f"   📊 Dimensions: {', '.join(dims)}\n"
            if spec:
                context += f"   👤 Specialist: {spec}\n"
        else:
            # Condensed info for upcoming cycles
            if dims or spec:
                context += f"   └─ {', '.join(dims) if dims else 'Foundation'} | {spec if spec else 'director'}\n"

    context += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

    # Add recent lessons learned (only if meaningful)
    if state.get("lessons_learned"):
        recent_lessons = [l for l in state["lessons_learned"][-5:] if l["lesson"] != f"Completed cycle {l['cycle']} successfully"]
        if recent_lessons:
            context += "💡 RECENT LESSONS LEARNED:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            for lesson in recent_lessons[-3:]:  # Last 3 meaningful lessons
                context += f"• Cycle {lesson['cycle']}: {lesson['lesson']}\n"
            context += "\n"

    context += """
🔄 WORKFLOW COMMANDS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/done     - Mark current cycle complete and advance
/next     - Skip to next cycle (if not applicable)
/reset    - Start new feature (reset to Cycle 1)
/plan     - View complete 100-cycle plan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    return context


def main():
    try:
        # Load hook input from stdin
        input_data = json.load(sys.stdin)
        prompt = input_data.get("prompt", "")

        # Load current state
        state = load_state()

        # Check if prompt is a workflow command
        if prompt.strip().startswith("/"):
            # Don't inject context for commands (they handle their own context)
            sys.exit(0)

        # Generate and output context
        context = generate_context(state)

        # Output as JSON with additionalContext
        output = {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": context,
            },
        }

        print(json.dumps(output))
        sys.exit(0)

    except Exception as e:
        # Don't block on errors, just log to stderr
        print(f"Error in todo hook: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
