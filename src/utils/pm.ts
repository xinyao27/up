/* agent-frontmatter:start
AGENT: Package Manager Utilities
PURPOSE: Detect available package managers and execute commands
USAGE: Import functions to check PM availability and run commands
EXPORTS: detectPackageManagers, execCommand, getGlobalPackages
FEATURES:
  - Detects installed package managers (npm, pnpm, yarn, bun)
  - Executes shell commands with proper error handling
  - Lists global packages for each package manager
SEARCHABLE: package manager, detection, global packages
agent-frontmatter:end */

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface GlobalPackage {
  name: string;
  version: string;
  pm: PackageManager;
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

export async function detectPackageManagers(): Promise<PackageManager[]> {
  const managers: PackageManager[] = ["npm", "pnpm", "yarn", "bun"];
  const available: PackageManager[] = [];

  for (const pm of managers) {
    if (await commandExists(pm)) {
      available.push(pm);
    }
  }

  return available;
}

export async function getGlobalPackages(pm: PackageManager): Promise<GlobalPackage[]> {
  try {
    let command: string;

    switch (pm) {
      case "npm":
        command = "npm list -g --depth=0 --json";
        break;
      case "pnpm":
        command = "pnpm list -g --depth 0";
        break;
      case "yarn":
        command = "yarn global list --json";
        break;
      case "bun":
        command = "bun pm ls -g";
        break;
    }

    const { stdout } = await execAsync(command);

    if (pm === "bun") {
      const lines = stdout.split("\n").filter((line) => line.trim());
      const packages: GlobalPackage[] = [];

      for (const line of lines) {
        // Remove tree characters (├──, └──, etc.) from bun output
        const cleanLine = line.replace(/^[│├└─\s]+/, "").trim();
        const match = cleanLine.match(/^(.+?)@(.+)$/);
        if (match?.[1] && match[2]) {
          packages.push({
            name: match[1].trim(),
            version: match[2].trim(),
            pm,
          });
        }
      }

      return packages;
    }

    if (pm === "pnpm") {
      const lines = stdout.split("\n").filter((line) => line.trim());
      const packages: GlobalPackage[] = [];

      for (const line of lines) {
        // Remove tree characters from pnpm output
        const cleanLine = line.replace(/^[│├└─\s]+/, "").trim();
        // pnpm format: "package-name version" (space separated)
        const match = cleanLine.match(/^(.+?)\s+(.+)$/);
        if (match?.[1] && match[2]) {
          packages.push({
            name: match[1].trim(),
            version: match[2].trim(),
            pm,
          });
        }
      }

      return packages;
    }

    if (pm === "yarn") {
      const lines = stdout.split("\n").filter((line) => line.trim());
      const packages: GlobalPackage[] = [];

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === "list" && data.data?.body) {
            for (const item of data.data.body) {
              const match = item.match(/(.+)@(.+)/);
              if (match) {
                packages.push({
                  name: match[1],
                  version: match[2],
                  pm,
                });
              }
            }
          }
        } catch {}
      }

      return packages;
    }

    const data = JSON.parse(stdout);
    const packages: GlobalPackage[] = [];

    if (data.dependencies) {
      for (const [name, info] of Object.entries<{ version?: string }>(data.dependencies)) {
        // Skip packages without version (e.g., broken installations)
        if (info.version) {
          packages.push({
            name,
            version: info.version,
            pm,
          });
        }
      }
    }

    return packages;
  } catch {
    // Return empty array instead of logging error
    // Let the caller handle the error
    return [];
  }
}

export async function upgradePackages(pm: PackageManager, packageNames: string[]): Promise<void> {
  if (packageNames.length === 0) return;

  const packages = packageNames.map((name) => `${name}@latest`).join(" ");
  let command: string;

  switch (pm) {
    case "npm":
      command = `npm install -g ${packages}`;
      break;
    case "pnpm":
      command = `pnpm add -g ${packages}`;
      break;
    case "yarn":
      command = `yarn global add ${packages}`;
      break;
    case "bun":
      command = `bun add -g ${packages}`;
      break;
  }

  await execAsync(command);
}
