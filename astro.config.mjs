import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Proven pattern from ../ants-at-work/website/astro.config.mjs
// Node adapter for dev (avoids miniflare issues), Cloudflare for production
const isDev = process.env.NODE_ENV !== "production";
const adapter = isDev
  ? node({ mode: "standalone" })
  : cloudflare({ prerenderEnvironment: 'node' });

// Development WebSocket server middleware for Vite
// Uses ssrLoadModule to import TS through Vite's transform pipeline
const devWebSocketMiddleware = isDev ? {
  name: 'dev-websocket',
  apply: 'serve',
  configureServer(server) {
    return () => {
      setImmediate(async () => {
        try {
          const mod = await server.ssrLoadModule('./src/lib/dev-ws-server.ts');
          mod.attachWebSocketServer(server.httpServer);
        } catch (err) {
          console.warn('[dev-ws] Skipped:', err.message);
        }
      });
    };
  },
} : null;

export default defineConfig({
  site: "https://one.ie",
  integrations: [react()],
  vite: {
    // In dev: proxy /api/signal to the live gateway so UI signals reach TypeDB
    // without needing a local TypeDB connection.
    ...(isDev ? {
      server: {
        proxy: {
          '/api/signal': {
            target: 'https://api.one.ie',
            changeOrigin: true,
            rewrite: (path) => path,
          },
        },
      },
    } : {}),
    plugins: [tailwindcss(), ...(devWebSocketMiddleware ? [devWebSocketMiddleware] : [])],
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
        // React 19 + Cloudflare Edge compat (production only)
        ...(isDev ? {} : {
          "react-dom/server": "react-dom/server.edge",
        }),
      },
      dedupe: ["react", "react-dom", "recharts"],
    },
    ssr: {
      noExternal: [
        "recharts",
        "lucide-react",
      ],
      // Keep heavy packages out of the SSR worker bundle.
      // shiki: code-block.tsx imports codeToHtml directly — all consumers
      //   are client:only so shiki never runs in the worker
      external: [
        "node:async_hooks",
        "@mysten/sui",
        "@mysten/bcs",
        "shiki",
        "@shikijs/core",
        "@shikijs/types",
        // Stripe: server SDK used in /api/pay/stripe/* — large, keep out of worker bundle
        "stripe",
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
