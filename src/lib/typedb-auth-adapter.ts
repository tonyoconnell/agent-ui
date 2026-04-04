/**
 * TypeDB Adapter for Better Auth
 *
 * Routes requests through an HTTP proxy to TypeDB Cloud.
 * Works on Node.js and all modern runtimes.
 */

import { createAdapter } from "better-auth/adapters";

export interface TypeDBAdapterConfig {
  url: string;
  database: string;
  username: string;
  password: string;
}

// Model → TypeDB entity mapping
const MODEL_TO_ENTITY: Record<string, string> = {
  user: "auth-user",
  session: "auth-session",
  account: "auth-account",
  verification: "auth-verification",
  rateLimit: "auth-rate-limit",
  ratelimit: "auth-rate-limit",
};

// Field → TypeDB attribute mapping
const FIELD_TO_ATTR: Record<string, string> = {
  id: "auth-id",
  name: "auth-name",
  email: "auth-email",
  emailVerified: "auth-email-verified",
  image: "auth-image",
  createdAt: "auth-created-at",
  updatedAt: "auth-updated-at",
  userId: "auth-user-id",
  token: "auth-token",
  expiresAt: "auth-expires-at",
  ipAddress: "auth-ip-address",
  userAgent: "auth-user-agent",
  accountId: "auth-account-id",
  providerId: "auth-provider-id",
  accessToken: "auth-access-token",
  refreshToken: "auth-refresh-token",
  idToken: "auth-id-token",
  accessTokenExpiresAt: "auth-access-token-expires-at",
  refreshTokenExpiresAt: "auth-refresh-token-expires-at",
  scope: "auth-scope",
  password: "auth-password",
  identifier: "auth-identifier",
  value: "auth-value",
  key: "auth-rate-limit-key",
  count: "auth-count",
  lastRequest: "auth-last-request",
};

const ATTR_TO_FIELD: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_TO_ATTR).map(([k, v]) => [v, k])
);

// HTTP client with token caching
let cachedToken: { token: string; expires: number } | null = null;

async function getToken(config: TypeDBAdapterConfig): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60000) {
    return cachedToken.token;
  }

  const res = await fetch(`${config.url}/typedb/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TypeDB signin failed: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const payload = JSON.parse(atob(data.token.split(".")[1]));
  cachedToken = { token: data.token, expires: payload.exp * 1000 };

  return cachedToken.token;
}

async function query(
  config: TypeDBAdapterConfig,
  tql: string,
  write: boolean
): Promise<any[]> {
  const token = await getToken(config);

  const res = await fetch(`${config.url}/typedb/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      databaseName: config.database,
      transactionType: write ? "write" : "read",
      query: tql,
      commit: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TypeDB query failed: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.answers || [];
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function escape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toTQL(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return `"${escape(value)}"`;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (value instanceof Date) return value.getTime().toString();
  return `"${escape(String(value))}"`;
}

function fieldToAttr(field: string): string {
  return (
    FIELD_TO_ATTR[field] ||
    `auth-${field.replace(/([A-Z])/g, "-$1").toLowerCase()}`
  );
}

function parseAnswer(answer: any): Record<string, any> {
  const result: Record<string, any> = {};
  if (!answer?.data) return result;

  for (const [varName, concept] of Object.entries(answer.data)) {
    const c = concept as any;
    if (c?.kind === "attribute" && c.value !== undefined) {
      const fieldName = ATTR_TO_FIELD[c.type?.label] || varName;
      result[fieldName] = c.value;
    }
  }
  return result;
}

export function typedbAdapter(config: TypeDBAdapterConfig) {
  return createAdapter({
    config: {
      adapterId: "typedb-http",
      adapterName: "TypeDB HTTP Adapter",
    },
    adapter: () => ({
      id: "typedb-http",

      create: async ({ model, data }) => {
        const entity = MODEL_TO_ENTITY[model] || `auth-${model}`;
        const id = data.id || generateId();
        const dataWithId = { ...data, id };

        const attrs = Object.entries(dataWithId)
          .filter(([_, v]) => v != null)
          .map(([k, v]) => `has ${fieldToAttr(k)} ${toTQL(v)}`)
          .join(", ");

        await query(config, `insert $e isa ${entity}, ${attrs};`, true);
        return dataWithId;
      },

      findOne: async ({ model, where }) => {
        const entity = MODEL_TO_ENTITY[model] || `auth-${model}`;
        if (!where?.length) return null;

        const conditions = where
          .map((w) => {
            const attr = fieldToAttr(w.field);
            return `$e has ${attr} ${toTQL(w.value)};`;
          })
          .join(" ");

        const tql = `match $e isa ${entity}; ${conditions} $e has $attr; select $attr; limit 100;`;

        try {
          const answers = await query(config, tql, false);
          if (!answers.length) return null;

          const result: Record<string, any> = {};
          for (const answer of answers) {
            Object.assign(result, parseAnswer(answer));
          }
          return (Object.keys(result).length ? result : null) as any;
        } catch {
          return null;
        }
      },

      findMany: async ({ model, where, limit: lim, offset }) => {
        const entity = MODEL_TO_ENTITY[model] || `auth-${model}`;

        let conditions = "";
        if (where?.length) {
          conditions = where
            .map((w) => `$e has ${fieldToAttr(w.field)} ${toTQL(w.value)};`)
            .join(" ");
        }

        let tql = `match $e isa ${entity}; ${conditions} $e has auth-id $id; select $id;`;
        if (lim) tql += ` limit ${lim};`;
        if (offset) tql += ` offset ${offset};`;

        const idAnswers = await query(config, tql, false);
        const ids = idAnswers
          .map((a) => a.data?.id?.value)
          .filter(Boolean);

        const results: any[] = [];
        for (const id of ids) {
          const entityTql = `match $e isa ${entity}, has auth-id "${escape(id)}"; $e has $attr; select $attr;`;
          const attrs = await query(config, entityTql, false);

          const obj: Record<string, any> = {};
          for (const answer of attrs) {
            Object.assign(obj, parseAnswer(answer));
          }
          if (Object.keys(obj).length) results.push(obj);
        }

        return results;
      },

      count: async ({ model, where }) => {
        const entity = MODEL_TO_ENTITY[model] || `auth-${model}`;

        let conditions = "";
        if (where?.length) {
          conditions = where
            .map((w) => `$e has ${fieldToAttr(w.field)} ${toTQL(w.value)};`)
            .join(" ");
        }

        try {
          const answers = await query(
            config,
            `match $e isa ${entity}; ${conditions} reduce $count = count;`,
            false
          );
          return answers[0]?.data?.count?.value || 0;
        } catch {
          return 0;
        }
      },

      update: async ({ model, where, update: updates }) => {
        const entity = MODEL_TO_ENTITY[model] || `auth-${model}`;
        if (!where?.length) return null;

        const conditions = where
          .map((w) => `$e has ${fieldToAttr(w.field)} ${toTQL(w.value)};`)
          .join(" ");

        for (const [field, value] of Object.entries(
          updates as Record<string, unknown>
        )) {
          if (value === undefined) continue;
          const attr = fieldToAttr(field);

          try {
            await query(
              config,
              `match $e isa ${entity}; ${conditions} $e has ${attr} $old; delete $old of $e;`,
              true
            );
          } catch {
            /* attr may not exist */
          }

          if (value !== null) {
            await query(
              config,
              `match $e isa ${entity}; ${conditions} insert $e has ${attr} ${toTQL(value)};`,
              true
            );
          }
        }

        const tql = `match $e isa ${entity}; ${conditions} $e has $attr; select $attr;`;
        const answers = await query(config, tql, false);

        const result: Record<string, any> = {};
        for (const answer of answers) {
          Object.assign(result, parseAnswer(answer));
        }
        return result as any;
      },

      updateMany: async ({ model, where, update: updates }) => {
        const entity = MODEL_TO_ENTITY[model] || `auth-${model}`;

        let conditions = "";
        if (where?.length) {
          conditions = where
            .map((w) => `$e has ${fieldToAttr(w.field)} ${toTQL(w.value)};`)
            .join(" ");
        }

        let count = 0;
        try {
          const answers = await query(
            config,
            `match $e isa ${entity}; ${conditions} reduce $count = count;`,
            false
          );
          count = answers[0]?.data?.count?.value || 0;
        } catch {
          /* ignore */
        }

        for (const [field, value] of Object.entries(
          updates as Record<string, unknown>
        )) {
          if (value === undefined) continue;
          const attr = fieldToAttr(field);

          try {
            await query(
              config,
              `match $e isa ${entity}; ${conditions} $e has ${attr} $old; delete $old of $e;`,
              true
            );
          } catch {
            /* ignore */
          }

          if (value !== null) {
            await query(
              config,
              `match $e isa ${entity}; ${conditions} insert $e has ${attr} ${toTQL(value)};`,
              true
            );
          }
        }

        return count;
      },

      delete: async ({ model, where }) => {
        const entity = MODEL_TO_ENTITY[model] || `auth-${model}`;
        if (!where?.length) return;

        const conditions = where
          .map((w) => `$e has ${fieldToAttr(w.field)} ${toTQL(w.value)};`)
          .join(" ");

        await query(
          config,
          `match $e isa ${entity}; ${conditions} delete $e;`,
          true
        );
      },

      deleteMany: async ({ model, where }) => {
        const entity = MODEL_TO_ENTITY[model] || `auth-${model}`;

        let conditions = "";
        if (where?.length) {
          conditions = where
            .map((w) => `$e has ${fieldToAttr(w.field)} ${toTQL(w.value)};`)
            .join(" ");
        }

        let count = 0;
        try {
          const answers = await query(
            config,
            `match $e isa ${entity}; ${conditions} reduce $count = count;`,
            false
          );
          count = answers[0]?.data?.count?.value || 0;
        } catch {
          /* ignore */
        }

        await query(
          config,
          `match $e isa ${entity}; ${conditions} delete $e;`,
          true
        );
        return count;
      },
    }),
  });
}

export default typedbAdapter;
