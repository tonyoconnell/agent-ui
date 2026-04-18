import { OneSdkError } from "./types.js";
import type {
  AgentActionResponse,
  AgentCapability,
  AgentStatusResponse,
  AuthAgentOpts,
  AuthAgentResponse,
  CapabilityItem,
  ClawOpts,
  ClawResponse,
  DecayResponse,
  DiscoverResponse,
  Health,
  HighwaysResponse,
  HypothesesResponse,
  MarkDimsResponse,
  Outcome,
  PayResponse,
  RegisterOpts,
  RegisterResponse,
  SdkConfig,
  SignalResponse,
  Stats,
  SyncAgentResponse,
  SyncAgentWorldInput,
} from "./types.js";
import { resolveApiKey, resolveBaseUrl } from "./urls.js";
import { emit } from "./telemetry.js";

async function req<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  apiKey?: string,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new OneSdkError(
      `${(init.method ?? "GET")} ${path} → ${res.status}`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

export class SubstrateClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  constructor(cfg: SdkConfig = {}) {
    this.baseUrl = resolveBaseUrl(cfg.baseUrl);
    this.apiKey = resolveApiKey(cfg.apiKey);
  }

  async signal(sender: string, receiver: string, data?: unknown): Promise<SignalResponse> {
    const result = await req<SignalResponse>(
      this.baseUrl,
      "/api/signal",
      { method: "POST", body: JSON.stringify({ sender, receiver, data }) },
      this.apiKey,
    );
    emit("toolkit:sdk:signal", ["sdk", "method-signal", result.success ? "200" : "error"]);
    return result;
  }

  async ask(receiver: string, data?: unknown, timeout?: number, from?: string): Promise<Outcome<unknown>> {
    const t = Date.now();
    const result = await req<Outcome<unknown>>(
      this.baseUrl,
      "/api/ask",
      { method: "POST", body: JSON.stringify({ receiver, data, timeout, from }) },
      this.apiKey,
    );
    const outcome =
      "result" in result ? "result"
      : "timeout" in result ? "timeout"
      : "dissolved" in result ? "dissolved"
      : "failure";
    emit("toolkit:sdk:ask", ["sdk", "method-ask", `outcome-${outcome}`], { latencyMs: Date.now() - t });
    return result;
  }

  async mark(
    edge: string,
    scores?: Partial<{ fit: number; form: number; truth: number; taste: number }>,
  ): Promise<MarkDimsResponse> {
    const result = await req<MarkDimsResponse>(
      this.baseUrl,
      "/api/loop/mark-dims",
      { method: "POST", body: JSON.stringify({ edge, ...(scores ?? { fit: 1, form: 1, truth: 1, taste: 1 }) }) },
      this.apiKey,
    );
    emit("toolkit:sdk:mark", ["sdk", "method-mark"]);
    return result;
  }

  async warn(
    edge: string,
    scores?: Partial<{ fit: number; form: number; truth: number; taste: number }>,
  ): Promise<MarkDimsResponse> {
    const result = await req<MarkDimsResponse>(
      this.baseUrl,
      "/api/loop/mark-dims",
      { method: "POST", body: JSON.stringify({ edge, ...(scores ?? { fit: 0, form: 0, truth: 0, taste: 0 }) }) },
      this.apiKey,
    );
    emit("toolkit:sdk:warn", ["sdk", "method-warn"]);
    return result;
  }

  async fade(trailRate?: number, resistanceRate?: number): Promise<DecayResponse> {
    const result = await req<DecayResponse>(
      this.baseUrl,
      "/api/decay-cycle",
      { method: "POST", body: JSON.stringify({ trailRate, resistanceRate }) },
      this.apiKey,
    );
    emit("toolkit:sdk:fade", ["sdk", "method-fade"]);
    return result;
  }

  async highways(limit = 10): Promise<HighwaysResponse> {
    const result = await req<HighwaysResponse>(
      this.baseUrl,
      `/api/loop/highways?limit=${limit}`,
      {},
      this.apiKey,
    );
    emit("toolkit:sdk:highways", ["sdk", "method-highways"]);
    return result;
  }

  async recall(status?: string): Promise<HypothesesResponse> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    const result = await req<HypothesesResponse>(
      this.baseUrl,
      `/api/hypotheses${qs}`,
      {},
      this.apiKey,
    );
    emit("toolkit:sdk:recall", ["sdk", "method-recall"]);
    return result;
  }

  async reveal(uid: string): Promise<unknown> {
    const result = await req<unknown>(
      this.baseUrl,
      `/api/memory/reveal/${encodeURIComponent(uid)}`,
      {},
      this.apiKey,
    );
    emit("toolkit:sdk:reveal", ["sdk", "method-reveal"]);
    return result;
  }

  async forget(uid: string): Promise<unknown> {
    const result = await req<unknown>(
      this.baseUrl,
      `/api/memory/forget/${encodeURIComponent(uid)}`,
      { method: "DELETE" },
      this.apiKey,
    );
    emit("toolkit:sdk:forget", ["sdk", "method-forget"]);
    return result;
  }

  async frontier(uid: string): Promise<unknown> {
    const result = await req<unknown>(
      this.baseUrl,
      `/api/memory/frontier/${encodeURIComponent(uid)}`,
      {},
      this.apiKey,
    );
    emit("toolkit:sdk:frontier", ["sdk", "method-frontier"]);
    return result;
  }

  async know(): Promise<unknown> {
    const result = await req<unknown>(this.baseUrl, "/api/tick", {}, this.apiKey);
    emit("toolkit:sdk:know", ["sdk", "method-know"]);
    return result;
  }

  async select(): Promise<unknown> {
    const result = await req<unknown>(
      this.baseUrl,
      "/api/loop/stage",
      { method: "POST", body: JSON.stringify({}) },
      this.apiKey,
    );
    emit("toolkit:sdk:select", ["sdk", "method-select"]);
    return result;
  }

  async authAgent(opts: AuthAgentOpts = {}): Promise<AuthAgentResponse> {
    const result = await req<AuthAgentResponse>(
      this.baseUrl,
      "/api/auth/agent",
      { method: "POST", body: JSON.stringify(opts) },
      this.apiKey,
    );
    emit("toolkit:sdk:authAgent", ["sdk", "method-authAgent", result.returning ? "returning" : "new"]);
    return result;
  }

  async syncAgent(input: string | SyncAgentWorldInput): Promise<SyncAgentResponse> {
    const body = typeof input === "string" ? { markdown: input } : input;
    const result = await req<SyncAgentResponse>(
      this.baseUrl,
      "/api/agents/sync",
      { method: "POST", body: JSON.stringify(body) },
      this.apiKey,
    );
    emit("toolkit:sdk:syncAgent", ["sdk", "method-syncAgent"]);
    return result;
  }

  async discover(skill: string, limit = 10): Promise<DiscoverResponse> {
    const qs = `?skill=${encodeURIComponent(skill)}&limit=${limit}`;
    const result = await req<DiscoverResponse>(
      this.baseUrl,
      `/api/agents/discover${qs}`,
      {},
      this.apiKey,
    );
    emit("toolkit:sdk:discover", ["sdk", "method-discover"]);
    return result;
  }

  async register(uid: string, opts: RegisterOpts = {}): Promise<RegisterResponse> {
    const result = await req<RegisterResponse>(
      this.baseUrl,
      "/api/agents/register",
      { method: "POST", body: JSON.stringify({ uid, ...opts }) },
      this.apiKey,
    );
    emit("toolkit:sdk:register", ["sdk", "method-register"]);
    return result;
  }

  async pay(from: string, to: string, task: string, amount: number): Promise<PayResponse> {
    const result = await req<PayResponse>(
      this.baseUrl,
      "/api/pay",
      { method: "POST", body: JSON.stringify({ from, to, task, amount }) },
      this.apiKey,
    );
    emit("toolkit:sdk:pay", ["sdk", "method-pay"]);
    return result;
  }

  async claw(name: string, opts: ClawOpts = {}): Promise<ClawResponse> {
    const result = await req<ClawResponse>(
      this.baseUrl,
      "/api/claw",
      { method: "POST", body: JSON.stringify({ name, ...opts }) },
      this.apiKey,
    );
    emit("toolkit:sdk:claw", ["sdk", "method-claw"]);
    return result;
  }

  async commend(uid: string): Promise<AgentActionResponse> {
    const result = await req<AgentActionResponse>(
      this.baseUrl,
      `/api/agents/${encodeURIComponent(uid)}/commend`,
      { method: "POST", body: JSON.stringify({}) },
      this.apiKey,
    );
    emit("toolkit:sdk:commend", ["sdk", "method-commend"]);
    return result;
  }

  async flag(uid: string): Promise<AgentActionResponse> {
    const result = await req<AgentActionResponse>(
      this.baseUrl,
      `/api/agents/${encodeURIComponent(uid)}/flag`,
      { method: "POST", body: JSON.stringify({}) },
      this.apiKey,
    );
    emit("toolkit:sdk:flag", ["sdk", "method-flag"]);
    return result;
  }

  async status(uid: string, active: boolean): Promise<AgentStatusResponse> {
    const result = await req<AgentStatusResponse>(
      this.baseUrl,
      `/api/agents/${encodeURIComponent(uid)}/status`,
      { method: "POST", body: JSON.stringify({ status: active ? "active" : "inactive" }) },
      this.apiKey,
    );
    emit("toolkit:sdk:status", ["sdk", "method-status"]);
    return result;
  }

  async capabilities(uid: string): Promise<CapabilityItem[]> {
    const result = await req<CapabilityItem[]>(
      this.baseUrl,
      `/api/agents/${encodeURIComponent(uid)}/capabilities`,
      {},
      this.apiKey,
    );
    emit("toolkit:sdk:capabilities", ["sdk", "method-capabilities"]);
    return result;
  }

  async stats(): Promise<Stats> {
    const result = await req<Stats>(this.baseUrl, "/api/stats", {}, this.apiKey);
    emit("toolkit:sdk:stats", ["sdk", "method-stats"]);
    return result;
  }

  async health(): Promise<Health> {
    const result = await req<Health>(this.baseUrl, "/api/health", {}, this.apiKey);
    emit("toolkit:sdk:health", ["sdk", "method-health"]);
    return result;
  }
}
