# @xystack/up

[![NPM version](https://img.shields.io/npm/v/@xystack/up?color=a1b858&label=)](https://www.npmjs.com/package/@xystack/up)

Interactive CLI to check and upgrade globally installed packages across multiple package managers.

## Features

- 🔍 **Auto-detect** package managers (npm, pnpm, yarn, bun)
- 📦 **List** all globally installed packages with current versions
- 🔄 **Check** for updates by fetching latest versions from the registry
- ✨ **Interactive** multi-select interface to choose packages to upgrade
- ⚡ **Batch upgrade** selected packages with progress feedback
- 🎨 **Beautiful** CLI interface powered by @clack/prompts

## Installation

```bash
# npm
npm install -g @xystack/up

# pnpm
pnpm add -g @xystack/up

# yarn
yarn global add @xystack/up

# bun
bun add -g @xystack/up
```

## Usage

Simply run the `up` command in your terminal:

```bash
up
```

The CLI will:

1. Detect available package managers on your system
2. Fetch all globally installed packages
3. Check for available updates
4. Present an interactive list of packages with updates
5. Let you select which packages to upgrade
6. Upgrade the selected packages

### Example Output

```
┌  @xystack/up
│
◇  Found 2 package managers: npm, pnpm
◇  Found 15 global packages
◇  Found 5 packages with updates
│
◆  Select packages to upgrade:
│  ◻ typescript (npm)  2.4.1 → 2.5.0
│  ◻ eslint (pnpm)     8.0.0 → 8.1.0
│  ◼ prettier (npm)    3.0.0 → 3.1.0
│  ◻ vite (bun)        5.0.0 → 5.1.0
│  ◼ turbo (pnpm)      1.10.0 → 1.11.0
└
```

## Development

### Prerequisites

- [Bun](https://bun.sh) (runtime and package manager)

### Setup

```bash
# Clone the repository
git clone https://github.com/xinyao27/up.git
cd up

# Install dependencies
bun install
```

### Available Scripts

```bash
# Run directly from source
bun run start

# Build the library
bun run build

# Run tests
bun test

# Lint and type check
bun run lint

# Type check only
bun run typecheck

# Update dependencies
bun run up

# Release new version
bun run release
```

### Project Structure

- `src/cli.ts` - Main CLI interface with interactive prompts
- `src/utils/pm.ts` - Package manager detection and operations
- `src/utils/registry.ts` - NPM registry version checking
- `dist/` - Build output (generated)

### Technology Stack

- **Runtime**: Bun
- **Build**: tsdown (generates CJS, ESM, and TypeScript declarations)
- **Linting**: Biome
- **CLI Framework**: @clack/prompts
- **Testing**: Bun's built-in test runner

## License

[MIT](./LICENSE) License © 2025 [xinyao27](https://github.com/xinyao27)
