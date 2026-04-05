"""
LLM — Model adapters

Simple complete() functions for common providers.
Same interface: (prompt, system?) -> str
"""

import os
import requests


def anthropic(api_key: str | None = None, model: str = "claude-sonnet-4-20250514"):
    """Anthropic Claude adapter."""
    key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")

    def complete(prompt: str, system: str | None = None) -> str:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "content-type": "application/json",
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": model,
                "max_tokens": 4096,
                "system": system or "",
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["content"][0]["text"]

    return complete


def openai(api_key: str | None = None, model: str = "gpt-4o"):
    """OpenAI adapter."""
    key = api_key or os.environ.get("OPENAI_API_KEY", "")

    def complete(prompt: str, system: str | None = None) -> str:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system or ""},
                    {"role": "user", "content": prompt},
                ],
            },
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

    return complete
