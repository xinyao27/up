import { describe, expect, it } from "bun:test";

import { compareVersions } from "../src/utils/registry";

describe("version comparison", () => {
  it("should detect newer versions", () => {
    expect(compareVersions("1.0.0", "1.0.1")).toBe(true);
    expect(compareVersions("1.0.0", "1.1.0")).toBe(true);
    expect(compareVersions("1.0.0", "2.0.0")).toBe(true);
  });

  it("should detect same or older versions", () => {
    expect(compareVersions("1.0.0", "1.0.0")).toBe(false);
    expect(compareVersions("1.0.1", "1.0.0")).toBe(false);
    expect(compareVersions("2.0.0", "1.0.0")).toBe(false);
  });

  it("should handle version prefixes", () => {
    expect(compareVersions("v1.0.0", "v1.0.1")).toBe(true);
    expect(compareVersions("^1.0.0", "^1.1.0")).toBe(true);
  });
});
