/* agent-frontmatter:start
AGENT: NPM Registry Utilities
PURPOSE: Fetch package information from npm registry
USAGE: Import functions to get latest package versions
EXPORTS: getLatestVersion, compareVersions
FEATURES:
  - Fetches latest version from npm registry
  - Compares semantic versions
  - Handles registry API errors gracefully
SEARCHABLE: npm registry, latest version, semver
agent-frontmatter:end */

export async function getLatestVersion(packageName: string): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.version || null;
  } catch {
    return null;
  }
}

export function compareVersions(current: string, latest: string): boolean {
  // Defensive checks for undefined/null versions
  if (!current || !latest) {
    return false;
  }

  const cleanCurrent = current.replace(/^[^0-9]+/, "");
  const cleanLatest = latest.replace(/^[^0-9]+/, "");

  const currentParts = cleanCurrent.split(".").map(Number);
  const latestParts = cleanLatest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const curr = currentParts[i] || 0;
    const lat = latestParts[i] || 0;

    if (lat > curr) return true;
    if (lat < curr) return false;
  }

  return false;
}
