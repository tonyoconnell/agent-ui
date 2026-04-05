"""
CLI — Markdown agents for Agentverse.

    one run agent.md              Run locally
    one parse agent.md            Validate and inspect
    one bundle agent.md           Generate self-contained agent.py
    one deploy agent.md           Bundle + deploy to Agentverse
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(prog="one", description="Markdown agents for Agentverse")
    sub = parser.add_subparsers(dest="command")

    # one run agent.md
    run = sub.add_parser("run", help="Run a markdown agent locally")
    run.add_argument("file", help="Path to .md file")
    run.add_argument("--llm", default="anthropic", choices=["anthropic", "openai"])
    run.add_argument("--model", default=None)

    # one parse agent.md
    check = sub.add_parser("parse", help="Parse and validate")
    check.add_argument("file")

    # one bundle agent.md
    bun = sub.add_parser("bundle", help="Generate self-contained agent.py")
    bun.add_argument("file")
    bun.add_argument("--llm", default="anthropic", choices=["anthropic", "openai"])
    bun.add_argument("--model", default=None)
    bun.add_argument("-o", "--output", default=None, help="Output path (default: ./agent.py)")

    # one deploy agent.md
    dep = sub.add_parser("deploy", help="Bundle + deploy to Agentverse")
    dep.add_argument("file")
    dep.add_argument("--llm", default="anthropic", choices=["anthropic", "openai"])
    dep.add_argument("--model", default=None)
    dep.add_argument("--name", default=None, help="Agent name on Agentverse")

    args = parser.parse_args()

    if args.command == "parse":
        from .parse import parse
        spec = parse(Path(args.file).read_text())
        print(json.dumps({
            "id": spec.id,
            "personality": spec.personality,
            "steps": [{"name": s.name, "prompt": s.prompt, "targets": s.targets} for s in spec.steps],
            "skills": [{"name": s.name, "prompt": s.prompt, "targets": s.targets} for s in spec.skills],
            "interval": {"seconds": spec.interval.seconds, "prompt": spec.interval.prompt} if spec.interval else None,
            "memory": spec.memory,
            "per_user": spec.per_user,
            "tiers": [{"name": t.name, "quota": t.quota, "period": t.quota_period, "threshold": t.threshold, "token": t.token} for t in spec.tiers],
            "secrets": spec.secrets,
            "tools": spec.tools,
            "price": spec.price,
            "currency": spec.currency,
        }, indent=2))

    elif args.command == "run":
        if args.llm == "anthropic":
            from .llm import anthropic
            complete = anthropic(model=args.model) if args.model else anthropic()
        else:
            from .llm import openai
            complete = openai(model=args.model) if args.model else openai()
        from .agent import md
        agent = md(Path(args.file).read_text(), complete)
        print(f"Running {args.file}...")
        agent.run()

    elif args.command == "bundle":
        from .bundle import bundle
        code = bundle(args.file, llm=args.llm, model=args.model)
        out = args.output or "agent.py"
        Path(out).write_text(code)
        print(f"Bundled → {out}")

    elif args.command == "deploy":
        from .bundle import bundle
        from .parse import parse

        spec = parse(Path(args.file).read_text())
        name = args.name or spec.id

        # Bundle to temp file
        code = bundle(args.file, llm=args.llm, model=args.model)
        tmp = Path("agent.py")
        tmp.write_text(code)
        print(f"Bundled {args.file} → agent.py")

        # Deploy via agentlaunch CLI
        cmd = ["npx", "agentlaunch", "deploy", "--file", "agent.py", "--name", name]
        print(f"Deploying {name} to Agentverse...")
        result = subprocess.run(cmd, capture_output=False)

        if result.returncode != 0:
            print("\nDeploy failed. Make sure agentlaunch CLI is configured:")
            print("  npx agentlaunch config set-key <your-api-key>")
            sys.exit(1)

    else:
        parser.print_help()
