import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: [
      "react",
      "react-dom/client",
      "react-dom/server",
      "react-router-dom",
      "@supabase/supabase-js",
      "@formaglyph/validators > @xmldom/xmldom",
      "morphicons/adapters",
      "morphicons/react",
    ],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/@supabase/") || id.includes("/node_modules/@realtime/")) return "supabase";
          if (id.includes("/node_modules/react-router") || id.includes("/node_modules/@remix-run/")) return "router";
          if (id.includes("/node_modules/@xmldom/") || id.includes("/packages/validators/")) return "validators";
        },
      },
    },
  },
  plugins: [react()],
});
