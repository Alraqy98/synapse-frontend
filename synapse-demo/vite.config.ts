import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
      "@modules": path.resolve(__dirname, "../src/modules"),
      "@components": path.resolve(__dirname, "../src/components"),
      "@assets": path.resolve(__dirname, "../src/assets"),
    },
  },
});
