import { useCallback, useEffect, useState } from "react";
import type { DiscoverResponse, HighwaysResponse } from "../types.js";
import { useSubstrate } from "./context.js";

const _cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!_cache.has(key)) _cache.set(key, fn());
  return _cache.get(key) as Promise<T>;
}

export function useAgent(uid: string) {
  const { client } = useSubstrate();
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    _cache.delete(`agent:${uid}`);
    setLoading(true);
    cached(`agent:${uid}`, () => client.reveal(uid))
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, [uid, client]);

  useEffect(() => {
    cached(`agent:${uid}`, () => client.reveal(uid))
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, [uid, client]);

  return { data, loading, error, refetch };
}

export function useDiscover(skill: string, limit = 10) {
  const { client } = useSubstrate();
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    cached(`discover:${skill}:${limit}`, () => client.discover(skill, limit))
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, [skill, limit, client]);

  return { data, loading, error };
}

export function useHighways(limit = 10) {
  const { client } = useSubstrate();
  const [data, setData] = useState<HighwaysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    _cache.delete(`highways:${limit}`);
    setLoading(true);
    cached(`highways:${limit}`, () => client.highways(limit))
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, [limit, client]);

  useEffect(() => {
    cached(`highways:${limit}`, () => client.highways(limit))
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, [limit, client]);

  return { data, loading, error, refetch };
}
