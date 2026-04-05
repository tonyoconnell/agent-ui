"""
PARSE — Markdown to AgentSpec

# Name, personality, steps, skills, every, remember, tiers, secrets, tools, price.
"""

from dataclasses import dataclass, field
import re


@dataclass
class Skill:
    name: str
    prompt: str
    targets: list[str] = field(default_factory=list)


@dataclass
class Interval:
    seconds: int
    prompt: str


@dataclass
class Tier:
    name: str
    quota: int | None = None
    quota_period: str = "hour"
    description: str = ""
    threshold: int = 0
    token: str = ""


@dataclass
class AgentSpec:
    id: str = ""
    personality: str = ""
    steps: list[Skill] = field(default_factory=list)
    skills: list[Skill] = field(default_factory=list)
    interval: Interval | None = None
    memory: dict = field(default_factory=dict)
    per_user: bool = False
    tiers: list[Tier] = field(default_factory=list)
    secrets: list[str] = field(default_factory=list)
    tools: list[str] = field(default_factory=list)
    price: float | None = None
    currency: str = "USDC"


def _parse_interval_header(header: str) -> int | None:
    """Parse '5 minutes' or '30 seconds' or '2 hours' into seconds."""
    m = re.search(r"(\d+)\s*(seconds?|minutes?|hours?|mins?|hrs?|s|m|h)", header)
    if not m:
        return None
    n = int(m.group(1))
    unit = m.group(2)[0]  # s, m, or h
    return n * {"s": 1, "m": 60, "h": 3600}[unit]


def _parse_tier(line: str) -> Tier | None:
    """Parse '- free: 5/hour, basic analysis' or '- premium (1000 $TOKEN): unlimited'."""
    m = re.match(r"^[-*]\s+(\w+)(?:\s*\((\d+)\s*\$(\w+)\))?\s*:\s*(.+)", line)
    if not m:
        return None
    name, threshold, token, rest = m.group(1), m.group(2), m.group(3), m.group(4)
    # Parse quota from rest: "5/hour" or "unlimited"
    quota, period, desc = None, "hour", rest
    qm = re.match(r"(\d+)/(hour|day|minute)\s*,?\s*(.*)", rest)
    if qm:
        quota, period, desc = int(qm.group(1)), qm.group(2), qm.group(3)
    elif rest.strip().startswith("unlimited"):
        desc = rest.replace("unlimited", "").strip().lstrip(",").strip()
    return Tier(
        name=name,
        quota=quota,
        quota_period=period,
        description=desc,
        threshold=int(threshold) if threshold else 0,
        token=f"${token}" if token else "",
    )


def parse(md: str) -> AgentSpec:
    spec = AgentSpec()
    section = "top"
    pending: Skill | None = None
    interval_lines: list[str] = []

    def flush():
        nonlocal pending
        if not pending:
            return
        if section == "steps":
            spec.steps.append(pending)
        elif section == "skills":
            spec.skills.append(pending)
        pending = None

    for raw in md.split("\n"):
        line = raw.strip()

        # # Name
        if line.startswith("# ") and not line.startswith("## "):
            spec.id = line[2:].strip().lower().replace(" ", "-")
            continue

        # ## Section
        if line.startswith("## "):
            flush()
            header = line[3:].strip()
            hl = header.lower()

            if hl == "steps":
                section = "steps"
            elif hl == "skills":
                section = "skills"
            elif hl.startswith("remember"):
                section = "remember"
                spec.per_user = "per-user" in hl or "per user" in hl
            elif hl == "tools":
                section = "tools"
            elif hl == "tiers":
                section = "tiers"
            elif hl == "secrets":
                section = "secrets"
            elif hl == "price":
                section = "price"
            elif hl.startswith("every"):
                section = "every"
                secs = _parse_interval_header(header)
                if secs:
                    spec.interval = Interval(seconds=secs, prompt="")
                    interval_lines.clear()
            else:
                section = "other"
            continue

        # Personality
        if section == "top" and line and spec.id:
            spec.personality += (" " if spec.personality else "") + line
            continue

        # → targets
        if line.startswith("→") or line.startswith("->"):
            targets = [t.strip() for t in re.sub(r"^(→|->)\s*", "", line).split(",") if t.strip()]
            if pending:
                pending.targets = targets
            continue

        # Steps
        if section == "steps":
            m = re.match(r"^\d+\.\s+\*{0,2}(\w[\w-]*)\*{0,2}\s*[—–-]\s*(.+)", line)
            if m:
                flush()
                pending = Skill(name=m.group(1), prompt=m.group(2))
                continue

        # Skills
        if section == "skills":
            m = re.match(r"^[-*]\s+\*{0,2}(\w[\w-]*)\*{0,2}\s*[—–-]\s*(.+)", line)
            if m:
                flush()
                pending = Skill(name=m.group(1), prompt=m.group(2))
                continue

        # Every (interval body)
        if section == "every" and line:
            interval_lines.append(line)
            continue

        # Remember
        if section == "remember":
            m = re.match(r"^[-*]\s+(\w[\w-]*):\s*(.+)", line)
            if m:
                v = m.group(2).strip()
                if v == "true":
                    spec.memory[m.group(1)] = True
                elif v == "false":
                    spec.memory[m.group(1)] = False
                else:
                    try:
                        spec.memory[m.group(1)] = float(v) if "." in v else int(v)
                    except ValueError:
                        spec.memory[m.group(1)] = v
                continue

        # Tiers
        if section == "tiers":
            tier = _parse_tier(line)
            if tier:
                spec.tiers.append(tier)
            continue

        # Secrets
        if section == "secrets":
            m = re.match(r"^[-*]\s+(\w+)", line)
            if m:
                spec.secrets.append(m.group(1))
            continue

        # Tools
        if section == "tools":
            m = re.match(r"^[-*]\s+(\w[\w-]*)", line)
            if m:
                spec.tools.append(m.group(1))
            continue

        # Price
        if section == "price":
            m = re.match(r"^([\d.]+)\s*(\w+)?", line)
            if m:
                spec.price = float(m.group(1))
                spec.currency = m.group(2) or "USDC"
            continue

    flush()

    # Finalize interval prompt
    if spec.interval and interval_lines:
        spec.interval.prompt = " ".join(interval_lines)

    return spec
