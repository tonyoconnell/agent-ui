#!/usr/bin/env python3
"""
ONE Platform - Done Hook
Marks current cycle complete and advances to next cycle.

This hook runs on Stop event to:
- Mark current cycle as complete
- Capture lessons learned (if any)
- Advance to next cycle
- Save updated state
"""
import json
import sys
import os
import time
from pathlib import Path
from typing import Dict, Any

# Import task descriptions and helpers from todo hook
from todo import (
    CYCLEENCE_TASKS,
    get_dimensions_for_cycle,
    get_specialist_for_cycle,
    get_phase_for_cycle,
    get_parallel_opportunities
)


def load_state() -> Dict[str, Any]:
    """Load current cycle state from .claude/state/cycle.json"""
    state_file = Path(os.environ.get("CLAUDE_PROJECT_DIR", ".")) / ".claude" / "state" / "cycle.json"

    if not state_file.exists():
        # Initialize default state
        default_state = {
            "current_cycle": 1,
            "completed_cycles": [],
            "feature_name": "New Feature",
            "organization": "Default Org",
            "person_role": "platform_owner",
            "lessons_learned": []
        }
        return default_state

    return json.loads(state_file.read_text())


def save_state(state: Dict[str, Any]):
    """Save cycle state to .claude/state/cycle.json"""
    state_file = Path(os.environ.get("CLAUDE_PROJECT_DIR", ".")) / ".claude" / "state" / "cycle.json"
    state_file.parent.mkdir(parents=True, exist_ok=True)
    state_file.write_text(json.dumps(state, indent=2))


def extract_lesson_from_transcript(transcript_path: str, cycle: int) -> str:
    """Extract lesson learned from conversation transcript"""
    try:
        if not transcript_path or not Path(transcript_path).exists():
            return f"Completed Cycle {cycle}"

        # Read transcript JSONL and extract key learnings
        with open(transcript_path, 'r') as f:
            lines = f.readlines()

        # Look for key phrases in assistant responses
        lessons = []
        for line in lines[-10:]:  # Last 10 messages
            try:
                msg = json.loads(line)
                if msg.get("role") == "assistant":
                    content = msg.get("content", "")
                    # Extract lessons (simple heuristic)
                    if "learned" in content.lower() or "lesson" in content.lower():
                        lessons.append(content[:200])  # First 200 chars
                    elif "success" in content.lower() and len(content) < 300:
                        lessons.append(content)
            except json.JSONDecodeError:
                continue

        if lessons:
            return lessons[-1]  # Most recent lesson
        return f"Completed Cycle {cycle}"

    except Exception as e:
        return f"Completed Cycle {cycle} (lesson extraction failed: {str(e)[:50]})"


def mark_complete_and_advance(state: Dict[str, Any], transcript_path: str) -> Dict[str, Any]:
    """Mark current cycle complete and advance to next"""
    current = state["current_cycle"]

    # Mark current cycle as complete
    if current not in state["completed_cycles"]:
        state["completed_cycles"].append(current)
        state["completed_cycles"].sort()

    # Extract lesson learned
    lesson = extract_lesson_from_transcript(transcript_path, current)
    state["lessons_learned"].append({
        "cycle": current,
        "lesson": lesson,
        "timestamp": int(time.time())  # Unix timestamp
    })

    # Advance to next cycle (unless we're at 100)
    if current < 100:
        state["current_cycle"] = current + 1
    else:
        # Feature complete!
        state["current_cycle"] = 100
        state["feature_complete"] = True

    return state


def generate_completion_message(state: Dict[str, Any]) -> str:
    """Generate message shown after marking complete"""
    previous = state["current_cycle"] - 1 if state["current_cycle"] > 1 else 1
    current = state["current_cycle"]
    completed_count = len(state["completed_cycles"])
    progress_pct = (completed_count / 100) * 100

    # Get info for next cycle
    task = CYCLEENCE_TASKS.get(current, "Unknown task")
    phase = get_phase_for_cycle(current)
    dimensions = get_dimensions_for_cycle(current)
    specialist = get_specialist_for_cycle(current)
    parallel_ops = get_parallel_opportunities(current)

    # Get most recent lesson
    recent_lesson = None
    if state.get("lessons_learned"):
        for lesson in reversed(state["lessons_learned"]):
            if lesson["cycle"] == previous and lesson["lesson"] != f"Completed Cycle {previous}":
                recent_lesson = lesson["lesson"]
                break

    message = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CYCLEENCE COMPLETE: Cycle {previous}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Progress:** {completed_count}/100 cycles complete ({progress_pct:.0f}%)
**Feature:** {state["feature_name"]}
"""

    if recent_lesson:
        message += f"\n💡 **Lesson Captured:** {recent_lesson[:150]}...\n"

    message += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{phase['icon']} NEXT CYCLEENCE: Cycle {current}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {phase['number']}/10:** {phase['name']} ({phase['progress']})
**Task:** {task}

**6-Dimension Ontology:** {", ".join(dimensions) if dimensions else "Foundation (all dimensions)"}
**Assigned Specialist:** {specialist if specialist else "director"}
"""

    if parallel_ops:
        message += f"\n⚡ **Parallel Opportunities:** {', '.join(parallel_ops)}\n"

    message += """
Ready to continue? Type your next prompt or use:
  /done     - Mark this cycle complete (when finished)
  /next     - Skip to next cycle (if not applicable)
  /reset    - Start new feature (reset to Cycle 1)
  /plan     - View complete 100-cycle plan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    # Special message when feature is complete
    if completed_count == 100:
        meaningful_lessons = [l for l in state.get("lessons_learned", [])
                            if l["lesson"] != f"Completed Cycle {l['cycle']}"]

        message = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 FEATURE COMPLETE: {state["feature_name"]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**All 100 cycles completed successfully!**

**Final Stats:**
- Organization: {state["organization"]}
- Person Role: {state["person_role"]}
- Lessons Learned: {len(meaningful_lessons)} meaningful insights captured

**Next Steps:**
1. Start new feature: /reset (or create new conversation)
2. Review all lessons: Check .claude/state/cycle.json
3. Deploy to production: /release

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Congratulations! 🎊 Your feature is production-ready.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    return message


def main():
    try:
        # Load hook input from stdin
        input_data = json.load(sys.stdin)
        transcript_path = input_data.get("transcript_path", "")

        # Load current state
        state = load_state()

        # Mark complete and advance
        state = mark_complete_and_advance(state, transcript_path)

        # Save updated state
        save_state(state)

        # Generate completion message
        message = generate_completion_message(state)

        # Output message (shown in transcript mode with Ctrl-R)
        print(message)

        # Exit with success
        sys.exit(0)

    except Exception as e:
        # Log error but don't block
        print(f"Error in done hook: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
