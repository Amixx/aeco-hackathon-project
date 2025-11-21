import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [svelte(), tailwindcss()],
  base: command === "build" ? "/aeco-hackathon-project/" : "/",
}));
