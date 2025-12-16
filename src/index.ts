/* agent-frontmatter:start
AGENT: CLI Entry Point
PURPOSE: Main executable entry point for the up CLI
USAGE: Called when user runs `up` command
EXPORTS: None (executable)
FEATURES:
  - Shebang for direct execution
  - Runs the CLI interface
  - Handles process errors
SEARCHABLE: entry point, executable, shebang
agent-frontmatter:end */

import { run } from "./cli";

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
