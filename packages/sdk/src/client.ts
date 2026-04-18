import { OneSdkError } from "./types.js";
import type {
  DecayResponse,
  HighwaysResponse,
  HypothesesResponse,
  MarkDimsResponse,
  Outcome,
  SdkConfig,
  SignalResponse,
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
}
