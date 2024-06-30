import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cloud-run.ts", "src/functions.ts"],
  format: "esm",
  splitting: false,
  sourcemap: true,
  clean: true,
});
