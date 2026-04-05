"""
BUNDLE — Pack a markdown agent into a single deployable agent.py

Inlines the one library + markdown into one file that Agentverse can run.
No pip install needed on the remote. Just agent.py.
"""

import os
import inspect
from pathlib import Path

from .parse import parse as _parse_fn


def bundle(md_path: str, llm: str = "anthropic", model: str | None = None) -> str:
    """Read a .md file and produce a self-contained agent.py string."""
    md_text = Path(md_path).read_text()
    spec = _parse_fn(md_text)

    # Escape for triple-quote embedding
    md_escaped = md_text.replace('\\', '\\\\').replace('"""', '\\"\\"\\"')

    # Read the library source files
    pkg_dir = Path(__file__).parent
    parse_src = (pkg_dir / "parse.py").read_text()
    agent_src = (pkg_dir / "agent.py").read_text()
    llm_src = (pkg_dir / "llm.py").read_text()

    # Strip module-level imports that reference .one (we inline everything)
    parse_src = parse_src.replace("from dataclasses import dataclass, field", "from dataclasses import dataclass, field")
    agent_src = agent_src.replace("from .parse import parse, AgentSpec, Skill", "# parse imported above")
    agent_src = agent_src.replace("from .parse import parse, AgentSpec", "# parse imported above")

    # Build secrets list for env
    secrets_lines = ""
    if spec.secrets:
        secrets_lines = "\n".join(f'# {s} = "your-key-here"' for s in spec.secrets)
        secrets_lines = f"\n# Required secrets (set in Agentverse):\n{secrets_lines}\n"

    # LLM setup
    if llm == "anthropic":
        model_str = f'"{model}"' if model else '"claude-sonnet-4-20250514"'
        llm_setup = f"""
# LLM
def _complete(prompt, system=None):
    import requests as _r
    r = _r.post("https://api.anthropic.com/v1/messages",
        headers={{"x-api-key": os.environ.get("ANTHROPIC_API_KEY", ""), "content-type": "application/json", "anthropic-version": "2023-06-01"}},
        json={{"model": {model_str}, "max_tokens": 4096, "system": system or "", "messages": [{{"role": "user", "content": prompt}}]}},
        timeout=60)
    r.raise_for_status()
    return r.json()["content"][0]["text"]
"""
    else:
        model_str = f'"{model}"' if model else '"gpt-4o"'
        llm_setup = f"""
# LLM
def _complete(prompt, system=None):
    import requests as _r
    r = _r.post("https://api.openai.com/v1/chat/completions",
        headers={{"Authorization": f"Bearer {{os.environ.get('OPENAI_API_KEY', '')}}", "content-type": "application/json"}},
        json={{"model": {model_str}, "messages": [{{"role": "system", "content": system or ""}}, {{"role": "user", "content": prompt}}]}},
        timeout=60)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]
"""

    return f'''"""
{spec.id} — Auto-generated from {os.path.basename(md_path)}

Deploy: agentlaunch deploy --file agent.py --name "{spec.id}"
"""

import os
{secrets_lines}
# ═══════════════════════════════════════════════════════════════════════════
# ONE LIBRARY (inlined)
# ═══════════════════════════════════════════════════════════════════════════

{parse_src}

{agent_src}
{llm_setup}
# ═══════════════════════════════════════════════════════════════════════════
# AGENT
# ═══════════════════════════════════════════════════════════════════════════

_MD = """{md_escaped}"""

agent = md(_MD, _complete)

if __name__ == "__main__":
    agent.run()
'''
