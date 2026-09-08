import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/for-inspiration/",
  plugins: [
    remix({
      basename: "/for-inspiration",
      ssr: false,
    }),
  ],
});
