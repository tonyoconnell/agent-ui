"""
BEFORE AND AFTER

The research agent from agent-launch-toolkit/examples/agents/research-agent.py
is 690 lines of Python:

    - Security class (40 lines)
    - Health class (20 lines)
    - Cache class (30 lines)
    - AI class (30 lines)
    - AgentLaunch class (25 lines)
    - Token gating (20 lines)
    - Rate limiting (15 lines)
    - Intent detection (40 lines)
    - Business logic (40 lines)
    - Message handler (100 lines)
    - Config, storage helpers, reply helper (50+ lines)
    - Chat protocol boilerplate (20 lines)

Here's the same agent:
"""

from one import md, anthropic

agent = md("""
# Researcher

Senior crypto analyst. Detailed, data-driven, actionable insights.

## Skills
- **analyze** — Provide detailed analysis on this crypto topic
- **compare** — Side-by-side comparison of protocols or tokens
- **report** — Summary report with key findings and risks

## Price
0.05 USDC
""", anthropic())

agent.run()
