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
  : cloudflare({ mode: "directory" });

export default defineConfig({
  site: "https://one.ie",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
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
  output: "server",
  adapter,
});
