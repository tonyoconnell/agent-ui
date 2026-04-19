import { getBaseUrl, tryGetApiKey } from "./config.js";

export interface HttpOpts {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export async function apiRequest<T = unknown>(path: string, opts: HttpOpts = {}): Promise<T> {
  const base = opts.baseUrl ?? getBaseUrl();
  const key = opts.apiKey ?? tryGetApiKey();
  const url = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = { Accept: "application/json", ...(opts.headers ?? {}) };
  if (key) headers.Authorization = `Bearer ${key}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${url} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as T;
}
