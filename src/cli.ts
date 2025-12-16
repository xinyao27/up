/* agent-frontmatter:start
AGENT: CLI Interface
PURPOSE: Interactive command-line interface for package updates
USAGE: Main entry point for the CLI application
EXPORTS: run
FEATURES:
  - Detects available package managers
  - Lists global packages with version info
  - Fetches latest versions from registry
  - Interactive multi-select for upgrades
  - Executes upgrades with progress feedback
SEARCHABLE: cli, interactive, prompts, upgrade
agent-frontmatter:end */

import * as p from "@clack/prompts";
import pc from "picocolors";
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

export async function run(): Promise<void> {
  console.clear();

  p.intro(pc.bgCyan(pc.black(" @xystack/up ")));

  const s = p.spinner();
  s.start("Detecting package managers");

  const packageManagers = await detectPackageManagers();

  if (packageManagers.length === 0) {
    s.stop("No package managers found");
    p.outro(
      pc.red("No package managers (npm, pnpm, yarn, bun) found on your system"),
    );
    process.exit(1);
  }

  s.stop(
    `Found ${pc.cyan(packageManagers.length)} package manager${packageManagers.length > 1 ? "s" : ""}: ${pc.cyan(packageManagers.join(", "))}`,
  );

  s.start("Fetching global packages");

  const allPackages: GlobalPackage[] = [];

  for (const pm of packageManagers) {
    const packages = await getGlobalPackages(pm);
    allPackages.push(...packages);
  }

  if (allPackages.length === 0) {
    s.stop("No global packages found");
    p.outro(pc.yellow("No global packages found to update"));
    process.exit(0);
  }

  s.stop(
    `Found ${pc.cyan(allPackages.length)} global package${allPackages.length > 1 ? "s" : ""}`,
  );

  s.start("Checking for updates");

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
    s.stop("Check complete");
    p.outro(pc.green("All packages are up to date!"));
    process.exit(0);
  }

  s.stop(
    `Found ${pc.cyan(updatablePackages.length)} package${updatablePackages.length > 1 ? "s" : ""} with updates`,
  );

  const options = updatablePackages.map((pkg) => ({
    value: pkg,
    label: `${pkg.name} ${pc.dim(`(${pkg.pm})`)}`,
    hint: `${pc.yellow(pkg.version)} → ${pc.green(pkg.latestVersion)}`,
  }));

  const selected = await p.multiselect({
    message: "Select packages to upgrade:",
    options,
    required: false,
  });

  if (p.isCancel(selected)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  if (!selected || selected.length === 0) {
    p.outro(pc.yellow("No packages selected"));
    process.exit(0);
  }

  const packagesToUpgrade = selected as PackageWithLatest[];

  const confirm = await p.confirm({
    message: `Upgrade ${packagesToUpgrade.length} package${packagesToUpgrade.length > 1 ? "s" : ""}?`,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  s.start("Upgrading packages");

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

  // Upgrade packages by package manager
  for (const [pm, packages] of packagesByPM) {
    const packageNames = packages.map((p) => p.name);
    const packageList = packageNames.join(", ");

    s.message(
      `[${processedCount + 1}-${processedCount + packages.length}/${totalCount}] Upgrading ${packageList} via ${pm}`,
    );

    try {
      await upgradePackages(pm, packageNames);
      processedCount += packages.length;
    } catch (error) {
      s.stop(`Failed to upgrade packages via ${pm}`);
      p.log.error(`${pm}: ${error}`);
    }
  }

  s.stop("All packages upgraded");
  p.outro(pc.green("Successfully upgraded all selected packages!"));
}
