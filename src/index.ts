/* agent-frontmatter:start
AGENT: Main Entry Point
PURPOSE: Check and upgrade globally installed packages
USAGE: Defines the main app with upgrade tool
EXPORTS: Default app definition
FEATURES:
  - Detects available package managers
  - Lists global packages with version info
  - Fetches latest versions from registry
  - Interactive multi-select for upgrades
  - Executes upgrades with progress feedback
SEARCHABLE: entry point, upgrade, global packages
agent-frontmatter:end */

import { colors, defineApp, spinner, tool } from "kly";
import { z } from "zod";
import {
  detectPackageManagers,
  type GlobalPackage,
  getGlobalPackages,
  type PackageManager,
  upgradePackages,
} from "./utils/pm";
import { compareVersions, getLatestVersion } from "./utils/registry";

interface PackageWithLatest extends GlobalPackage {
  latestVersion: string;
  hasUpdate: boolean;
}

const upgradeTool = tool({
  name: "upgrade",
  description: "Check and upgrade global packages",
  inputSchema: z.object({
    all: z
      .boolean()
      .optional()
      .describe("Upgrade all packages without prompting"),
  }),
  execute: async (args) => {
    let s = spinner("Detecting package managers");

    const packageManagers = await detectPackageManagers();

    if (packageManagers.length === 0) {
      s.fail("No package managers found");
      throw new Error(
        "No package managers (npm, pnpm, yarn, bun) found on your system",
      );
    }

    s.succeed(
      `Found ${colors.cyan(packageManagers.length.toString())} package manager${packageManagers.length > 1 ? "s" : ""}: ${colors.cyan(packageManagers.join(", "))}`,
    );

    s = spinner("Fetching global packages");

    const allPackages: GlobalPackage[] = [];

    for (const pm of packageManagers) {
      const packages = await getGlobalPackages(pm);
      allPackages.push(...packages);
    }

    if (allPackages.length === 0) {
      s.succeed("No global packages found");
      return {
        success: true,
        message: "No global packages found to update",
      };
    }

    s.succeed(
      `Found ${colors.cyan(allPackages.length.toString())} global package${allPackages.length > 1 ? "s" : ""}`,
    );

    s = spinner("Checking for updates");

    const packagesWithLatest: PackageWithLatest[] = [];

    for (const pkg of allPackages) {
      const latestVersion = await getLatestVersion(pkg.name);

      if (latestVersion) {
        const hasUpdate = compareVersions(pkg.version, latestVersion);
        packagesWithLatest.push({
          ...pkg,
          latestVersion,
          hasUpdate,
        });
      }
    }

    const updatablePackages = packagesWithLatest.filter((pkg) => pkg.hasUpdate);

    if (updatablePackages.length === 0) {
      s.succeed("All packages are up to date!");
      return {
        success: true,
        message: "All packages are up to date!",
      };
    }

    s.succeed(
      `Found ${colors.cyan(updatablePackages.length.toString())} package${updatablePackages.length > 1 ? "s" : ""} with updates`,
    );

    // If --all flag is provided, upgrade all without prompting
    const packagesToUpgrade = args.all
      ? updatablePackages
      : await promptPackageSelection(updatablePackages);

    if (!packagesToUpgrade || packagesToUpgrade.length === 0) {
      return {
        success: false,
        message: "No packages selected for upgrade",
      };
    }

    s = spinner("Upgrading packages");

    // Group packages by package manager
    const packagesByPM = new Map<PackageManager, PackageWithLatest[]>();
    for (const pkg of packagesToUpgrade) {
      if (!packagesByPM.has(pkg.pm)) {
        packagesByPM.set(pkg.pm, []);
      }
      packagesByPM.get(pkg.pm)?.push(pkg);
    }

    let processedCount = 0;
    const totalCount = packagesToUpgrade.length;
    const failed: string[] = [];

    // Upgrade packages by package manager
    for (const [pm, packages] of packagesByPM) {
      const packageNames = packages.map((p) => p.name);
      const packageList = packageNames.join(", ");

      s.update(
        `[${processedCount + 1}-${processedCount + packages.length}/${totalCount}] Upgrading ${packageList} via ${pm}`,
      );

      try {
        await upgradePackages(pm, packageNames);
        processedCount += packages.length;
      } catch (error) {
        s.fail(`Failed to upgrade packages via ${pm}`);
        failed.push(`${pm}: ${error}`);
      }
    }

    if (processedCount === totalCount) {
      s.succeed("All packages upgraded");
    } else {
      s.fail("Upgrade completed with errors");
    }

    return {
      success: failed.length === 0,
      upgraded: processedCount,
      total: totalCount,
      failed,
      message:
        failed.length === 0
          ? `Successfully upgraded ${processedCount} package${processedCount > 1 ? "s" : ""}!`
          : `Upgraded ${processedCount}/${totalCount} packages. ${failed.length} failed.`,
    };
  },
});

/**
 * Prompt user to select packages for upgrade
 */
async function promptPackageSelection(
  packages: PackageWithLatest[],
): Promise<PackageWithLatest[]> {
  // Import prompts dynamically to avoid issues in non-TTY environments
  const { multiselect, isCancel, confirm } = await import("@clack/prompts");

  const options = packages.map((pkg) => ({
    value: pkg,
    label: `${pkg.name} ${colors.dim(`(${pkg.pm})`)}`,
    hint: `${colors.yellow(pkg.version)} → ${colors.green(pkg.latestVersion)}`,
  }));

  const selected = await multiselect({
    message: "Select packages to upgrade:",
    options,
    required: false,
  });

  if (isCancel(selected)) {
    return [];
  }

  if (!selected || selected.length === 0) {
    return [];
  }

  const packagesToUpgrade = selected as PackageWithLatest[];

  const confirmUpgrade = await confirm({
    message: `Upgrade ${packagesToUpgrade.length} package${packagesToUpgrade.length > 1 ? "s" : ""}?`,
  });

  if (isCancel(confirmUpgrade) || !confirmUpgrade) {
    return [];
  }

  return packagesToUpgrade;
}

export default defineApp({
  name: "@xinyao27/up",
  version: "0.1.0",
  description:
    "Interactive CLI to check and upgrade globally installed packages",
  tools: [upgradeTool],
});
