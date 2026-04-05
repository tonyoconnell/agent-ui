"""
Price Monitor — watches tokens, alerts on thresholds.

Compare to price-monitor-agent.py in agent-launch-toolkit: ~500 lines.
"""

from one import md, anthropic

agent = md(open("price-monitor.md").read(), anthropic())
agent.run()
