"""
Research Agent — 690 lines of Python became 4 lines.

Runs on Agentverse. Same chat protocol. Same wallet. Same everything.
"""

from one import md, anthropic

agent = md(open("researcher.md").read(), anthropic())
agent.run()
