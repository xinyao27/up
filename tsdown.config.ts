import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    dts: true,
    exports: true,
    publint: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
