"""
Blog Post Agent — outlines, drafts, polishes. Charges 0.1 USDC per post.
"""

from one import md, anthropic

agent = md(open("blogger.md").read(), anthropic())
agent.run()
