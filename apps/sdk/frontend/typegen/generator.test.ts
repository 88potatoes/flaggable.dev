import { describe, expect, it } from "vitest";
import { generateTypeDeclarations, jsonSchemaToTypeScript } from "./generator";

describe("typegen generator", () => {
  it("converts primitive and enum schemas correctly", () => {
    expect(jsonSchemaToTypeScript({ type: "boolean" })).toBe("boolean");
    expect(jsonSchemaToTypeScript({ type: "boolean", enum: [true, false] })).toBe("boolean");
    expect(jsonSchemaToTypeScript({ type: "string" })).toBe("string");
    expect(jsonSchemaToTypeScript({ type: "string", enum: ["dark", "light", "system"] })).toBe(
      '"dark" | "light" | "system"',
    );
    expect(jsonSchemaToTypeScript({ type: "number" })).toBe("number");
    expect(jsonSchemaToTypeScript({ const: "fixed-value" })).toBe('"fixed-value"');
  });

  it("converts objects and arrays", () => {
    expect(jsonSchemaToTypeScript({ type: "array", items: { type: "string" } })).toBe(
      "Array<string>",
    );

    const objectSchema = {
      type: "object",
      properties: {
        theme: { type: "string", enum: ["light", "dark"] },
        limit: { type: "number" },
      },
      required: ["theme"],
    };

    const generated = jsonSchemaToTypeScript(objectSchema);
    expect(generated).toContain('theme: "light" | "dark";');
    expect(generated).toContain("limit?: number;");
  });

  it("generates module augmentation output with flag declarations", () => {
    const output = generateTypeDeclarations({
      projectId: "proj-123",
      projectName: "Storefront",
      flags: [
        {
          id: "flag-1",
          name: "new-checkout",
          description: "Enables fast checkout",
          enabled: true,
          schema: { type: "boolean" },
        },
        {
          id: "flag-2",
          name: "cart-limit",
          enabled: true,
          schema: { type: "number" },
        },
      ],
    });

    expect(output).toContain('declare module "@flaggable/sdk"');
    expect(output).toContain('declare module "@flaggable/sdk/react"');
    expect(output).toContain('declare module "@flaggable/sdk/core"');
    expect(output).toContain('"new-checkout": boolean;');
    expect(output).toContain('"cart-limit": number;');
    expect(output).toContain("Enables fast checkout");
  });
});
