import { describe, expect, it } from "vitest";
import { generateAgentPrompt, FLAGGABLE_SDK_DOCS_MARKDOWN } from "./agent-docs";

describe("agent-docs", () => {
  it("generates a complete AI agent setup prompt for Next.js", () => {
    const prompt = generateAgentPrompt({
      baseUrl: "https://flaggable.dev",
      publicKey: "pk_test_1234567890",
      flagName: "new-checkout-button",
      projectName: "Storefront App",
    });

    expect(prompt).toContain("@flaggable/sdk");
    expect(prompt).toContain("https://flaggable.dev");
    expect(prompt).toContain("pk_test_1234567890");
    expect(prompt).toContain("new-checkout-button");
    expect(prompt).toContain("Storefront App");
    expect(prompt).toContain("NEXT_PUBLIC_FLAGGABLE_BASE_URL");
    expect(prompt).toContain("NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY");
    expect(prompt).toContain("FlagProvider");
    expect(prompt).toContain("FlaggableDemo");
    expect(prompt).toContain("https://flaggable.dev/docs/sdk.md");
  });

  it("handles trailing slash in baseUrl properly", () => {
    const prompt = generateAgentPrompt({
      baseUrl: "https://flaggable.dev/",
      publicKey: "pk_abc",
      flagName: "test-flag",
    });

    expect(prompt).toContain('NEXT_PUBLIC_FLAGGABLE_BASE_URL="https://flaggable.dev"');
    expect(prompt).toContain("https://flaggable.dev/docs/sdk.md");
    expect(prompt).not.toContain("https://flaggable.dev//");
  });

  it("contains valid markdown documentation content", () => {
    expect(FLAGGABLE_SDK_DOCS_MARKDOWN).toContain("# @flaggable/sdk Documentation");
    expect(FLAGGABLE_SDK_DOCS_MARKDOWN).toContain("npm install @flaggable/sdk");
    expect(FLAGGABLE_SDK_DOCS_MARKDOWN).toContain("FlagProvider");
    expect(FLAGGABLE_SDK_DOCS_MARKDOWN).toContain("useFlag");
    expect(FLAGGABLE_SDK_DOCS_MARKDOWN).toContain("useEvaluate");
  });
});
