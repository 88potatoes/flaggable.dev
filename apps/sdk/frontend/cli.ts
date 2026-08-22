#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateTypeDeclarations, type TypegenResponse } from "./typegen/generator";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawVal] = match;
    let val = rawVal.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  // Load .env.local then .env
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));

  const command = args[0];
  if (!command || command === "--help" || command === "-h" || command === "help") {
    console.log(`
Flaggable CLI

Usage:
  flaggable typegen [options]
  flaggable create-flag <name> [options]

Options:
  --out <path>       Output path for generated types (default: ./flaggable.d.ts)
  --key <key>        Internal API key (or set FLAGGABLE_INTERNAL_API_KEY env)
  --base-url <url>   Flaggable server base URL (default: https://flaggable.dev)
  --schema <id>      Value schema ID for create-flag (defaults to the project's first schema)
  --description <text> Description for create-flag
  --help, -h         Show help
`);
    return;
  }

  if (command !== "typegen" && command !== "create-flag") {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }

  let outPath = "./flaggable.d.ts";
  let flagName = command === "create-flag" ? args[1]?.trim() : undefined;
  let schemaId: string | undefined;
  let description: string | undefined;
  let internalKey = process.env.FLAGGABLE_INTERNAL_API_KEY;
  let baseUrl =
    process.env.FLAGGABLE_BASE_URL ||
    process.env.NEXT_PUBLIC_FLAGGABLE_BASE_URL ||
    "https://flaggable.dev";

  for (let i = command === "create-flag" ? 2 : 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--out" && args[i + 1]) {
      outPath = args[++i];
    } else if (arg === "--key" && args[i + 1]) {
      internalKey = args[++i];
    } else if (arg === "--base-url" && args[i + 1]) {
      baseUrl = args[++i];
    } else if (arg === "--schema" && args[i + 1]) {
      schemaId = args[++i];
    } else if (arg === "--description" && args[i + 1]) {
      description = args[++i];
    }
  }

  if (command === "create-flag" && !flagName) {
    console.error("Error: create-flag requires a flag name.");
    process.exit(1);
  }

  if (!internalKey?.trim()) {
    console.error(
      "\x1b[31mError: FLAGGABLE_INTERNAL_API_KEY is missing.\x1b[0m\n" +
        "Set FLAGGABLE_INTERNAL_API_KEY in your .env.local file or pass via --key <key>.",
    );
    process.exit(1);
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/v1/devtool/${command === "typegen" ? "typegen" : "flag"}`;
  console.log(
    `${command === "typegen" ? "Fetching flag schemas from" : "Creating flag at"} ${endpoint}...`,
  );

  try {
    const res = await fetch(endpoint, {
      method: command === "typegen" ? "GET" : "POST",
      headers: {
        "x-flaggable-internal-api-key": internalKey.trim(),
        "content-type": "application/json",
      },
      ...(command === "create-flag"
        ? {
            body: JSON.stringify({
              name: flagName,
              ...(schemaId ? { valueSchemaId: schemaId } : {}),
              ...(description ? { description } : {}),
            }),
          }
        : {}),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string | { message?: string; code?: string; requestId?: string };
      };
      const error =
        typeof body.error === "string" ? body.error : body.error?.message || res.statusText;
      const code = typeof body.error === "object" ? body.error.code : undefined;
      const requestId = typeof body.error === "object" ? body.error.requestId : undefined;
      console.error(
        `\x1b[31m${command === "typegen" ? "Typegen" : "Create flag"} failed (${res.status})${code ? ` [${code}]` : ""}: ${error}${requestId ? ` (request: ${requestId})` : ""}\x1b[0m`,
      );
      process.exit(1);
    }

    const data = await res.json();
    if (command === "create-flag") {
      console.log(
        `\x1b[32m✔ Created flag "${(data as { name: string }).name}" (${(data as { id: string }).id})\x1b[0m`,
      );
      return;
    }
    const typedData = data as TypegenResponse;
    const output = generateTypeDeclarations(typedData);
    const resolvedPath = resolve(process.cwd(), outPath);
    writeFileSync(resolvedPath, output, "utf8");

    console.log(
      `\x1b[32m✔ Successfully generated types for ${typedData.flags.length} flag(s) in ${outPath}\x1b[0m`,
    );
  } catch (err) {
    console.error(
      `\x1b[31mError connecting to Flaggable API:\x1b[0m`,
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }
}

// If executed directly from Node CLI
if (
  typeof process !== "undefined" &&
  process.argv &&
  process.argv[1] &&
  process.argv[1].endsWith("cli.ts")
) {
  void runCli();
}
