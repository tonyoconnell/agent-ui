"""UNIFIED.PY - Production Substrate. Secure. Stable. Fast."""
from __future__ import annotations
from typing import Any, Callable
from dataclasses import dataclass
from collections import defaultdict
from hashlib import sha256
from time import time
import heapq

@dataclass
class Envelope:
    receiver: str
    payload: Any = None

class Unit:
    def __init__(self, id: str, route: Callable = None):
        self.id, self._route, self._tasks, self._next = id, route, {}, {}

    def __call__(self, env: Envelope, frm: str = "entry"):
        name = env.receiver.split(":")[1] if ":" in env.receiver else "default"
        task = self._tasks.get(name) or self._tasks.get("default")
        if not task: return
        emit = lambda e: self._route(e, env.receiver) if self._route else None
        r = task(env.payload, emit, {"from": frm, "self": env.receiver})
        if name in self._next and r: self._route(self._next[name](r), env.receiver)

    def on(self, n: str, fn: Callable) -> Unit: self._tasks[n] = fn; return self
    def then(self, n: str, t: Callable) -> Unit: self._next[n] = t; return self

class World:
    FEE, WIN, LOSS, DECAY = 0.02, 0.10, 0.10, 0.05  # Economics
    MIN_STAKE, MAX_STAKE_RATIO = 1.0, 0.10           # Security
    POOL_FLOOR, POOL_CEILING = 1000.0, 1000000.0    # Stability
    GRANT = 50.0                                     # Growth

    def __init__(self):
        self.units, self.scent, self.balances = {}, defaultdict(float), defaultdict(float)
        self.pool, self.treasury = 10000.0, 0.0
        self.agents, self.escrow = {}, {}
        self._cache, self._dirty, self._v = [], True, 0

    # ── Security ──────────────────────────────────────────────────────────────
    def register(self, id: str, pubkey: str = None) -> bool:
        if id in self.agents: return False
        self.agents[id] = {"pubkey": pubkey or sha256(id.encode()).hexdigest()[:16],
                          "created": time(), "rep": 0.0, "rate": 0, "rate_t": 0}
        self.balances[id] = self.GRANT; return True

    def _rate_ok(self, id: str, limit: int = 60) -> bool:
        a, now = self.agents.get(id, {}), int(time() / 60)
        if a.get("rate_t") != now: a["rate_t"], a["rate"] = now, 0
        a["rate"] += 1; return a["rate"] <= limit

    # ── Core ──────────────────────────────────────────────────────────────────
    def spawn(self, id: str) -> Unit:
        self.units[id] = Unit(id, lambda e, f: self.send(e, f)); return self.units[id]

    def send(self, env: Envelope, frm: str = "entry"):
        uid = env.receiver.split(":")[0]
        if uid in self.units: self._edge(f"{frm}->{env.receiver}", 1); self.units[uid](env, frm)

    def _edge(self, e: str, d: float):
        self.scent[e] += d
        if self.scent[e] < 0.01: del self.scent[e]
        self._dirty, self._v = True, self._v + 1

    def fade(self, r: float = None):
        for e in list(self.scent): d = self.scent[e] * (r or self.DECAY); self.treasury += d; self._edge(e, -d)

    def highways(self, n: int = 10) -> list:
        if self._dirty: self._cache = heapq.nlargest(n * 2, self.scent.items(), key=lambda x: x[1]); self._dirty = False
        return self._cache[:n]

    # ── Staking ───────────────────────────────────────────────────────────────
    def stake(self, who: str, tgt: str, amt: float) -> bool:
        if who not in self.agents or not self._rate_ok(who): return False
        if amt < self.MIN_STAKE: return False
        amt = min(amt, self.pool * self.MAX_STAKE_RATIO, self.balances[who])
        if amt <= 0: return False
        self.balances[who] -= amt; self.treasury += amt * self.FEE
        self._edge(f"{who}->{tgt}", amt * (1 - self.FEE)); return True

    def resolve(self, who: str, tgt: str, win: bool) -> float:
        e, w = f"{who}->{tgt}", self.scent.get(f"{who}->{tgt}", 0)
        if win:
            g = min(w * self.WIN, max(0, self.pool - self.POOL_FLOOR))
            self.pool -= g; self.treasury += g * self.FEE; self._edge(e, g * (1 - self.FEE))
            self.agents[who]["rep"] += 1
        else:
            self.pool = min(self.pool + w * self.LOSS, self.POOL_CEILING); self._edge(e, -w * self.LOSS)
            self.agents[who]["rep"] = max(0, self.agents[who]["rep"] - 0.5)
        return self.scent.get(e, 0)

    # ── Swarm ─────────────────────────────────────────────────────────────────
    def post(self, who: str, task: str, bounty: float, timeout: int = 86400) -> bool:
        if who not in self.agents or self.balances[who] < bounty: return False
        self.balances[who] -= bounty; self.treasury += bounty * self.FEE
        self.escrow[task] = {"b": bounty * (1 - self.FEE), "t": time() + timeout, "r": who, "w": []}; return True

    def join(self, who: str, task: str, amt: float) -> bool:
        if task not in self.escrow or not self.stake(who, task, amt): return False
        self.escrow[task]["w"].append(who); return True

    def complete(self, task: str, win: bool, agree: bool = True) -> dict:
        if task not in self.escrow: return {}
        e = self.escrow[task]; auto = time() > e["t"]
        if not win and not agree and not auto: return {"status": "disputed"}
        b, members = e["b"], [(w, self.scent.get(f"{w}->{task}", 0)) for w in e["w"]]
        total, payouts = sum(v for _, v in members) or 1, {}
        for who, stk in members:
            self.resolve(who, task, win)
            if win and b: p = b * stk / total; self.treasury += p * self.FEE; self.balances[who] += p * (1 - self.FEE)
            payouts[who] = round(self.balances[who], 2)
        del self.escrow[task]; return payouts

    # ── Growth ────────────────────────────────────────────────────────────────
    def onboard(self, id: str, ref: str = None) -> bool:
        if not self.register(id): return False
        if ref and ref in self.agents: self._edge(f"{ref}->{id}", 5.0); self.agents[ref]["rep"] += 0.5
        return True

    def seed(self, tasks: list[tuple[str, float]]):
        for task, b in tasks:
            if self.pool >= b + self.POOL_FLOOR:
                self.pool -= b; self.escrow[task] = {"b": b, "t": time() + 604800, "r": "platform", "w": []}

    # ── Stability ─────────────────────────────────────────────────────────────
    def snapshot(self) -> dict:
        return {"v": self._v, "t": time(), "scent": dict(self.scent), "bal": dict(self.balances),
                "agents": self.agents, "pool": self.pool, "treasury": self.treasury, "escrow": self.escrow}

    def restore(self, s: dict):
        self.scent, self.balances = defaultdict(float, s["scent"]), defaultdict(float, s["bal"])
        self.agents, self.pool, self.treasury, self.escrow = s["agents"], s["pool"], s["treasury"], s["escrow"]
        self._dirty, self._v = True, s["v"]

def world() -> World: return World()

if __name__ == "__main__":
    w = world()
    w.onboard("alice"); w.onboard("bob", ref="alice"); w.onboard("carol", ref="alice")
    print(f"Agents: {list(w.agents.keys())}, Alice rep: {w.agents['alice']['rep']}")

    w.seed([("task1", 100), ("task2", 50)])
    print(f"Tasks: {list(w.escrow.keys())}")

    w.join("bob", "task1", 20); w.join("carol", "task1", 10)
    payouts = w.complete("task1", win=True)
    print(f"Payouts: {payouts}, Treasury: {w.treasury:.2f}")
    print(f"Highways: {w.highways(5)}")
