"""
AGENT — Markdown to running uagents agent

Parses markdown. Wires chat protocol. Routes skills. Chains steps.
Per-user memory. Intervals. Tiers. Secrets. Health. Caching. Targets.
"""

from datetime import datetime
from uuid import uuid4
from typing import Callable
import hashlib
import json
import logging
import os
import time

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

from .parse import parse, AgentSpec, Skill

logger = logging.getLogger("one")
Complete = Callable[[str, str | None], str]

AGENTLAUNCH_API = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api").rstrip("/")

# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════


def _store_get(ctx: Context, key: str, default=None):
    try:
        raw = ctx.storage.get(key)
        return json.loads(raw) if raw else default
    except Exception:
        return default


def _store_set(ctx: Context, key: str, value):
    try:
        ctx.storage.set(key, json.dumps(value))
    except Exception:
        pass


async def _reply(ctx: Context, sender: str, text: str, end: bool = True):
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    await ctx.send(sender, ChatMessage(timestamp=datetime.utcnow(), msg_id=uuid4(), content=content))


async def _send_to(ctx: Context, target: str, text: str):
    """Send result to another agent by address (from env or direct)."""
    # Resolve: check env for AGENT_NAME_ADDRESS, else use target as address
    name = target.split(":")[0].upper().replace("-", "_")
    address = os.environ.get(f"{name}_ADDRESS", target)
    try:
        await ctx.send(
            address,
            ChatMessage(timestamp=datetime.utcnow(), msg_id=uuid4(),
                        content=[TextContent(type="text", text=text)]),
        )
    except Exception as e:
        ctx.logger.error(f"Failed to send to {target}: {e}")


def _match_skill(text: str, skills: list[Skill]) -> Skill | None:
    t = text.lower()
    for s in skills:
        if s.name.lower() in t:
            return s
    return skills[0] if skills else None


# ═══════════════════════════════════════════════════════════════════════════
# CACHE
# ═══════════════════════════════════════════════════════════════════════════


class _Cache:
    def __init__(self, max_size: int = 500):
        self._data: dict[str, tuple[str, float]] = {}
        self._max = max_size

    def get(self, prompt: str) -> str | None:
        key = hashlib.sha256(prompt.encode()).hexdigest()[:16]
        if key in self._data:
            val, exp = self._data[key]
            if exp > time.time():
                return val
            del self._data[key]
        return None

    def set(self, prompt: str, response: str, ttl: int = 600):
        if len(self._data) >= self._max:
            oldest = sorted(self._data, key=lambda k: self._data[k][1])[:self._max // 5]
            for k in oldest:
                del self._data[k]
        key = hashlib.sha256(prompt.encode()).hexdigest()[:16]
        self._data[key] = (response, time.time() + ttl)


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════════════════════


class _Health:
    def __init__(self):
        self.start = time.time()
        self.requests = 0
        self.errors = 0

    def record(self, ok: bool):
        self.requests += 1
        if not ok:
            self.errors += 1

    def status(self) -> str:
        rate = (self.errors / self.requests * 100) if self.requests else 0
        up = int(time.time() - self.start)
        return f"{'healthy' if rate < 10 else 'degraded'} | {up}s up | {self.requests} req | {rate:.0f}% err"


# ═══════════════════════════════════════════════════════════════════════════
# TIERS
# ═══════════════════════════════════════════════════════════════════════════


def _check_tier(spec: AgentSpec, sender: str, cache: _Cache) -> str:
    if not spec.tiers:
        return "free"
    premium = next((t for t in spec.tiers if t.threshold > 0), None)
    if not premium:
        return "free"

    cached = cache.get(f"tier:{sender}")
    if cached:
        return cached

    token_addr = os.environ.get("TOKEN_ADDRESS", "")
    if not token_addr:
        return "free"

    try:
        import requests
        r = requests.get(
            f"{AGENTLAUNCH_API}/agents/token/{token_addr}/holders",
            params={"holder": sender}, timeout=5,
        )
        if r.status_code == 200:
            balance = r.json().get("balance", 0)
            tier = "premium" if balance >= premium.threshold else "free"
            cache.set(f"tier:{sender}", tier, ttl=300)
            return tier
    except Exception:
        pass
    return "free"


def _check_quota(ctx: Context, spec: AgentSpec, sender: str, tier_name: str) -> str | None:
    tier = next((t for t in spec.tiers if t.name == tier_name), None)
    if not tier or tier.quota is None:
        return None

    period_secs = {"minute": 60, "hour": 3600, "day": 86400}.get(tier.quota_period, 3600)
    key = f"one:quota:{spec.id}:{sender}"
    times = _store_get(ctx, key, [])
    cutoff = time.time() - period_secs
    times = [t for t in times if t > cutoff]

    if len(times) >= tier.quota:
        premium = next((t for t in spec.tiers if t.threshold > 0), None)
        nudge = f"\n\nHold {premium.threshold} {premium.token} for unlimited access." if premium else ""
        return f"Limit reached: {tier.quota}/{tier.quota_period}.{nudge}"

    times.append(time.time())
    _store_set(ctx, key, times)
    return None


# ═══════════════════════════════════════════════════════════════════════════
# MEMORY
# ═══════════════════════════════════════════════════════════════════════════


def _mem_key(spec: AgentSpec, sender: str) -> str:
    suffix = sender[:20] if spec.per_user else "global"
    return f"one:mem:{spec.id}:{suffix}"


def _load_memory(ctx: Context, spec: AgentSpec, sender: str) -> dict:
    mem = _store_get(ctx, _mem_key(spec, sender), None)
    return mem if mem is not None else dict(spec.memory)


def _save_memory(ctx: Context, spec: AgentSpec, sender: str, mem: dict):
    _store_set(ctx, _mem_key(spec, sender), mem)


def _mem_context(mem: dict) -> str:
    """Format memory as context string for LLM."""
    if not mem:
        return ""
    lines = [f"- {k}: {v}" for k, v in mem.items()]
    return "\n\nYour current memory:\n" + "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════
# TOOLS
# ═══════════════════════════════════════════════════════════════════════════


def _tools_context(tools: dict[str, Callable] | None) -> str:
    """Tell the LLM what tools are available."""
    if not tools:
        return ""
    names = ", ".join(tools.keys())
    return f"\n\nAvailable tools: {names}. To use a tool, write TOOL: <name>(<args>)"


def _run_tools(text: str, tools: dict[str, Callable] | None) -> str | None:
    """Extract and run TOOL: calls from LLM output. Returns enriched text."""
    if not tools or "TOOL:" not in text:
        return None
    import re
    enriched = text
    for m in re.finditer(r"TOOL:\s*(\w+)\(([^)]*)\)", text):
        name, args = m.group(1), m.group(2)
        fn = tools.get(name)
        if fn:
            try:
                result = fn(args) if args else fn()
                enriched = enriched.replace(m.group(0), f"[{name} result: {result}]")
            except Exception as e:
                enriched = enriched.replace(m.group(0), f"[{name} error: {e}]")
    return enriched if enriched != text else None


# ═══════════════════════════════════════════════════════════════════════════
# SKILL EXECUTION
# ═══════════════════════════════════════════════════════════════════════════


def _complete_cached(complete: Complete, cache: _Cache, prompt: str, system: str | None) -> str:
    cached = cache.get(prompt)
    if cached:
        return cached
    result = complete(prompt, system)
    cache.set(prompt, result)
    return result


def _build_prompt(skill: Skill, input_text: str, tier: str, spec: AgentSpec,
                  mem: dict, tools: dict[str, Callable] | None) -> str:
    base = f"{skill.prompt}\n\nInput:\n{input_text}"
    base += _mem_context(mem)
    base += _tools_context(tools)
    tier_obj = next((t for t in spec.tiers if t.name == tier), None)
    if tier_obj and tier_obj.description:
        base += f"\n\nResponse style: {tier_obj.description}"
    if tier == "free" and any(t.threshold > 0 for t in spec.tiers):
        base += "\n\nKeep response concise (3-4 sentences)."
    return base


async def _run_chain(steps: list[Skill], input_text: str, personality: str,
                     tier: str, spec: AgentSpec, complete: Complete,
                     cache: _Cache, mem: dict, tools: dict[str, Callable] | None) -> str:
    result = input_text
    for step in steps:
        prompt = _build_prompt(step, result, tier, spec, mem, tools)
        result = _complete_cached(complete, cache, prompt, personality)
        # Run any tool calls in the LLM output
        enriched = _run_tools(result, tools)
        if enriched:
            # Re-run with tool results injected
            result = _complete_cached(complete, cache,
                f"{step.prompt}\n\nInput:\n{result}\n\nTool results:\n{enriched}",
                personality)
    return result


# ═══════════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════════


def md(source: str, complete: Complete, tools: dict[str, Callable] | None = None) -> Agent:
    """Parse markdown, return a running uagents Agent."""
    spec = parse(source)

    # Validate secrets
    missing = [s for s in spec.secrets if not os.environ.get(s)]
    if missing:
        raise EnvironmentError(f"Missing secrets: {', '.join(missing)}")

    agent = Agent(name=spec.id)
    chat_proto = Protocol(spec=chat_protocol_spec)
    cache = _Cache()
    health = _Health()

    @chat_proto.on_message(ChatMessage)
    async def handle(ctx: Context, sender: str, msg: ChatMessage):
        await ctx.send(sender, ChatAcknowledgement(timestamp=datetime.utcnow(), acknowledged_msg_id=msg.msg_id))

        text = " ".join(i.text for i in msg.content if isinstance(i, TextContent)).strip()
        if not text:
            await _reply(ctx, sender, "Send me a message to get started.")
            return

        ctx.logger.info(f"[{spec.id}] {sender[:16]}: {text[:60]}")

        # Tier + quota
        tier = _check_tier(spec, sender, cache)
        quota_err = _check_quota(ctx, spec, sender, tier)
        if quota_err:
            health.record(False)
            await _reply(ctx, sender, quota_err)
            return

        # Memory
        mem = _load_memory(ctx, spec, sender)

        try:
            if spec.steps:
                result = await _run_chain(spec.steps, text, spec.personality,
                                          tier, spec, complete, cache, mem, tools)
                # Send to last step's targets
                if spec.steps[-1].targets:
                    for t in spec.steps[-1].targets:
                        await _send_to(ctx, t, result)
            elif spec.skills:
                skill = _match_skill(text, spec.skills)
                prompt = _build_prompt(skill, text, tier, spec, mem, tools)
                result = _complete_cached(complete, cache, prompt, spec.personality)
                # Run tool calls
                enriched = _run_tools(result, tools)
                if enriched:
                    result = _complete_cached(complete, cache,
                        f"{skill.prompt}\n\nInput:\n{text}\n\nTool results:\n{enriched}",
                        spec.personality)
                # Send to skill's targets
                if skill.targets:
                    for t in skill.targets:
                        await _send_to(ctx, t, result)
            else:
                result = _complete_cached(complete, cache, text + _mem_context(mem), spec.personality)

            # Free tier nudge
            if tier == "free" and any(t.threshold > 0 for t in spec.tiers):
                premium = next(t for t in spec.tiers if t.threshold > 0)
                result += f"\n\n---\n*Hold {premium.threshold} {premium.token} for detailed responses + unlimited access.*"

            _save_memory(ctx, spec, sender, mem)
            health.record(True)
            await _reply(ctx, sender, result)

        except Exception as e:
            ctx.logger.error(f"[{spec.id}] {e}")
            health.record(False)
            await _reply(ctx, sender, "Something went wrong. Please try again.")

    @chat_proto.on_message(ChatAcknowledgement)
    async def ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
        pass

    # Interval — has full ctx, can read/write storage and send messages
    if spec.interval:
        @agent.on_interval(period=spec.interval.seconds)
        async def tick(ctx: Context):
            ctx.logger.info(f"[{spec.id}] tick")
            mem = _store_get(ctx, f"one:mem:{spec.id}:global", spec.memory)
            try:
                result = complete(
                    f"{spec.interval.prompt}\n\nCurrent state:\n{json.dumps(mem, indent=2)}"
                    f"\n\nRespond with JSON if state should change. Otherwise respond with any alerts to send.",
                    spec.personality,
                )
                # Try to parse state updates from LLM
                try:
                    updated = json.loads(result)
                    if isinstance(updated, dict):
                        mem.update(updated)
                        _store_set(ctx, f"one:mem:{spec.id}:global", mem)
                        ctx.logger.info(f"[{spec.id}] state updated: {list(updated.keys())}")
                except (json.JSONDecodeError, TypeError):
                    pass
                ctx.logger.info(f"[{spec.id}] tick: {result[:120]}")
            except Exception as e:
                ctx.logger.error(f"[{spec.id}] tick error: {e}")

    # Health interval
    @agent.on_interval(period=3600)
    async def health_log(ctx: Context):
        ctx.logger.info(f"[{spec.id}] {health.status()}")

    agent.include(chat_proto, publish_manifest=True)
    return agent
