import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts"],
    dts: true,
    exports: true,
    publint: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/types.ts"],
    },
  },
  fmt: {
    sortImports: {},
    sortPackageJson: true,
    sortTailwindcss: {},
  },
});
