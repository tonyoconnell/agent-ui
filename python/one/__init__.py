"""
ONE — Describe an agent in markdown. Run it anywhere.

    from one import md
    from one.llm import anthropic

    agent = md(open("researcher.md").read(), anthropic())
    agent.run()
"""

from .parse import parse, AgentSpec


def md(source, complete, tools=None):
    """Lazy import — only loads uagents when you actually build an agent."""
    from .agent import md as _md
    return _md(source, complete, tools)


def anthropic(api_key=None, model="claude-sonnet-4-20250514"):
    from .llm import anthropic as _anthropic
    return _anthropic(api_key, model)


def openai(api_key=None, model="gpt-4o"):
    from .llm import openai as _openai
    return _openai(api_key, model)


__all__ = ["md", "parse", "AgentSpec", "anthropic", "openai"]
