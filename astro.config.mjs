import { EventEmitter } from "node:events";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Vite + Astro + content collections + Cloudflare vite-plugin attach a lot of
// watchers to the same FSWatcher in dev. Default Node cap is 10; we hit ~11.
// Bumping the default silences the warning without papering over a real leak —
// these listeners are legitimately distinct subscribers.
EventEmitter.defaultMaxListeners = 20;

// Cloudflare adapter for dev AND prod — same runtime, same bindings (D1/KV/R2).
// `@astrojs/cloudflare@13` runs workerd in-process for dev via `@cloudflare/vite-plugin`,
// so `cloudflare:workers` env, D1.prepare, etc. all resolve identically to production.
// `prerenderEnvironment: 'node'` is build-time only — prerendered routes evaluate under
// Node before bundling, then hand off to workerd at runtime.
const adapter = cloudflare({ prerenderEnvironment: 'node' });

// Dev-only WebSocket attach for live task updates. Loads the module via
// Vite's CLIENT-SIDE module runner (Node-side, plain Vite) — NOT
// `ssrLoadModule`, which under @astrojs/cloudflare v13 routes through the
// workerd runner and rejects on `node:http`/`ws` imports.
// Best-effort: any failure is logged and skipped, never crashes the dev server.
const devWebSocketMiddleware = {
  name: 'dev-websocket',
  apply: 'serve',
  configureServer(server) {
    return () => {
      setImmediate(async () => {
        try {
          // server.environments.client.fetchModule keeps Node-side resolution.
          // If unavailable (older Vite or different runner), fall back to a
          // direct dynamic import of the compiled JS via tsx/bun; if THAT
          // fails, skip — WS is optional dev infrastructure.
          const url = new URL('./src/lib/dev-ws-server.ts', import.meta.url).pathname;
          const mod = await import(url).catch(() => null);
          if (mod && typeof mod.attachWebSocketServer === 'function' && server.httpServer) {
            mod.attachWebSocketServer(server.httpServer);
          } else {
            console.warn('[dev-ws] Skipped: module did not load (live task updates disabled in this dev session)');
          }
        } catch (err) {
          console.warn('[dev-ws] Skipped:', err.message);
        }
      });
    };
  },
};

export default defineConfig({
  site: "https://one.ie",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), devWebSocketMiddleware],
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
      dedupe: ["react", "react-dom", "recharts"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@astrojs/react/client.js",
        "lucide-react",
      ],
    },
    ssr: {
      noExternal: [
        "recharts",
        "lucide-react",
      ],
      // `ssr.external` here helps Vite's dev SSR pass — in dev workerd, deps
      // that look like Node packages get left for the runtime to resolve.
      // It does NOT remove deps from the deployed CF Worker bundle (that
      // bundle inlines everything reachable). Stripe (~620 KB) and its
      // transitive picocolors (~550 KB) are necessarily bundled because
      // src/pages/api/pay/stripe/* import them — moving stripe to a
      // separate worker would be the only way to slim further.
      external: [
        "node:async_hooks",
        // bun:sqlite is referenced by src/lib/local-d1.ts (Bun scripts/tests
        // only). Mark external so Vite doesn't try to bundle a Bun-specific
        // module into the worker SSR pass.
        "bun:sqlite",
        // @mysten/sui & shiki: declared external because all callers are
        // client:only — no server-side import path exists. Defends against
        // accidental future imports from server code pulling them in.
        "@mysten/sui",
        "@mysten/bcs",
        "shiki",
        "@shikijs/core",
        "@shikijs/types",
        // @stripe/* (browser-side): always loaded as client:only
        "@stripe/react-stripe-js",
        "@stripe/stripe-js",
      ],
    },
    build: {
      target: "esnext",
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('recharts')) return 'recharts'
            if (id.includes('lucide-react')) return 'icons'
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
            if (id.includes('@xyflow')) return 'reactflow'
          },
        },
      },
    },
  },
  markdown: {
    // Disable Shiki syntax highlighting — saves ~5.8 MiB of grammar/WASM
    // from the SSR worker bundle. Pages content is rendered client-side anyway.
    syntaxHighlight: false,
  },
  output: "server",
  adapter,
  security: { checkOrigin: false },
});
