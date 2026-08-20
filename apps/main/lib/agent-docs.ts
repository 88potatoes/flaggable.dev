/**
 * Documentation content and prompt generators for AI coding agents integrating @flaggable/sdk.
 */

export interface AgentPromptOptions {
  baseUrl: string;
  flagName: string;
  publicKey?: string;
  projectName?: string;
}

export function generateEnvSnippet({
  publicKey = "pk_your_project_public_key",
  internalKey = "ik_your_internal_api_key",
  baseUrl,
}: {
  publicKey?: string;
  internalKey?: string;
  baseUrl?: string;
}): string {
  const lines = [`NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY="${publicKey}"`];
  if (internalKey) {
    lines.push(`FLAGGABLE_INTERNAL_API_KEY="${internalKey}"`);
  }
  if (baseUrl) {
    const clean = baseUrl.replace(/\/$/, "");
    if (clean && clean !== "https://flaggable.dev") {
      lines.unshift(`NEXT_PUBLIC_FLAGGABLE_BASE_URL="${clean}"`);
    }
  }
  return lines.join("\n");
}

export function generateAgentPrompt({
  baseUrl,
  flagName,
  projectName,
}: AgentPromptOptions): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const docsUrl = `${cleanBaseUrl}/docs/sdk.md`;

  return `Set up the @flaggable/sdk feature flag SDK in this Next.js project.

### Configuration
- Package: \`@flaggable/sdk\`
- Target Feature Flag: \`${flagName}\`${projectName ? `\n- Project: \`${projectName}\`` : ""}
- SDK Documentation: \`${docsUrl}\`
- Environment Variables: Assumed to be configured in \`.env.local\` (\`NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY\` and \`FLAGGABLE_INTERNAL_API_KEY\`).

### Implementation Steps

1. **Install the SDK**:
   Run: \`pnpm add @flaggable/sdk\` (or \`npm install @flaggable/sdk\`)

2. **Generate TypeScript Types**:
   Run: \`npx flaggable typegen\`
   This generates \`flaggable.d.ts\` providing type safety and autocomplete for project feature flags.

3. **Create the Flaggable Provider Component**:
   Create \`components/flaggable-provider.tsx\` (or \`app/providers.tsx\`):
   \`\`\`tsx
   "use client";

   import type { ReactNode } from "react";
   import { FlagProvider } from "@flaggable/sdk/react";

   export function FlaggableClientProvider({ children }: { children: ReactNode }) {
     const publicKey = process.env.NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY;

     if (!publicKey) {
       return <>{children}</>;
     }

     return (
       <FlagProvider publicKey={publicKey} pollInterval={30000}>
         {children}
       </FlagProvider>
     );
   }
   \`\`\`

4. **Wrap the Root Layout**:
   In \`app/layout.tsx\`, wrap the app body with \`<FlaggableClientProvider>\`:
   \`\`\`tsx
   import { FlaggableClientProvider } from "@/components/flaggable-provider";

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en">
         <body>
           <FlaggableClientProvider>
             {children}
           </FlaggableClientProvider>
         </body>
       </html>
     );
   }
   \`\`\`

5. **Implement a Demo UI Indicator / Toggle**:
   Create \`components/flaggable-demo.tsx\` that reads the \`${flagName}\` flag and renders an interactive indicator:
   \`\`\`tsx
   "use client";

   import { useFlag, useFlagClient } from "@flaggable/sdk/react";
   import { useState } from "react";

   export function FlaggableDemo() {
     const isEnabled = useFlag({ flagName: "${flagName}", fallbackValue: false });
     const client = useFlagClient();
     const [isRefreshing, setIsRefreshing] = useState(false);

     const handleSync = async () => {
       setIsRefreshing(true);
       try {
         await client.refresh();
       } finally {
         setIsRefreshing(false);
       }
     };

     return (
       <div className={\`my-6 rounded-xl border p-4 shadow-sm transition-all \${
         isEnabled
           ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
           : "border-zinc-200 bg-zinc-50 text-zinc-800"
       }\`}>
         <div className="flex items-center justify-between gap-4">
           <div className="space-y-1">
             <div className="flex items-center gap-2">
               <span className={\`size-2.5 rounded-full \${isEnabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}\`} />
               <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                 Flaggable Feature Status
               </span>
             </div>
             <p className="text-sm font-medium">
               Flag: <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-xs">${flagName}</code>
             </p>
             <p className="text-xs text-zinc-600">
               State: <strong className={isEnabled ? "text-emerald-700" : "text-zinc-700"}>{isEnabled ? "ACTIVE (Flag is ON)" : "INACTIVE (Flag is OFF)"}</strong>
             </p>
           </div>
           <button
             type="button"
             onClick={handleSync}
             disabled={isRefreshing}
             className="rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 disabled:opacity-50"
           >
             {isRefreshing ? "Syncing..." : "Sync now"}
           </button>
         </div>
       </div>
     );
   }
   \`\`\`
   Mount \`<FlaggableDemo />\` on the home page (\`app/page.tsx\`) so the flag status is visible.

6. **Verify & Test**:
   Run \`npm run dev\` and toggle the \`${flagName}\` flag in the Flaggable dashboard to verify live evaluation.
`;
}

export const FLAGGABLE_SDK_DOCS_MARKDOWN = `# @flaggable/sdk Documentation

Flaggable is a modern, lightweight, reactive feature flag platform.
The \`@flaggable/sdk\` package provides client-side and server-side feature flag evaluation with automatic background polling and zero-overhead reactivity for React and Next.js.

## Installation

\`\`\`bash
npm install @flaggable/sdk
# or
pnpm add @flaggable/sdk
# or
yarn add @flaggable/sdk
\`\`\`

## Quick Start (Next.js App Router)

### 1. Environment Variables (\`.env.local\`)
\`\`\`env
NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY="pk_your_project_public_key"
FLAGGABLE_INTERNAL_API_KEY="ik_your_internal_api_key"
\`\`\`

### 2. Client Provider (\`components/flaggable-provider.tsx\`)
\`\`\`tsx
"use client";

import type { ReactNode } from "react";
import { FlagProvider } from "@flaggable/sdk/react";

export function FlaggableClientProvider({ children }: { children: ReactNode }) {
  const publicKey = process.env.NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY ?? "";

  if (!publicKey) return <>{children}</>;

  return (
    <FlagProvider publicKey={publicKey} pollInterval={30000}>
      {children}
    </FlagProvider>
  );
}
\`\`\`

### 3. Root Layout (\`app/layout.tsx\`)
\`\`\`tsx
import { FlaggableClientProvider } from "@/components/flaggable-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FlaggableClientProvider>{children}</FlaggableClientProvider>
      </body>
    </html>
  );
}
\`\`\`

### 4. Evaluating Flags in Components
\`\`\`tsx
"use client";

import { useFlag } from "@flaggable/sdk/react";

export function CheckoutButton() {
  const isNewCheckout = useFlag({ flagName: "new-checkout-flow", fallbackValue: false });

  if (isNewCheckout) {
    return <button className="bg-emerald-600 text-white px-4 py-2 rounded">New 1-Click Checkout</button>;
  }

  return <button className="bg-zinc-800 text-white px-4 py-2 rounded">Standard Checkout</button>;
}
\`\`\`

---

## API Design: Object Parameters

All Flaggable SDK methods and hooks take **object parameters** rather than positional arguments (e.g. \`useFlag({ flagName, fallbackValue })\`, \`client.get({ flagName, fallbackValue })\`, \`client.setEvaluationContext({ context })\`) to ensure maximum readability and future extensibility.

---

## React API Reference (\`@flaggable/sdk/react\`)

### \`<FlagProvider>\`
Props:
- \`publicKey\` (string, required): The public SDK key from your Flaggable project.
- \`baseUrl\` (string, optional): The Flaggable host URL (default: \`https://flaggable.dev\`).
- \`pollInterval\` (number, optional): Polling interval in ms (default: \`30000\`).

### \`useFlag<T>({ flagName, fallbackValue, context }): T\`
Returns the reactive evaluation for the given flag name. Automatically re-evaluates when polling receives new evaluations.
- \`flagName\` (string, required): Name of the flag to evaluate.
- \`fallbackValue\` (T, required): Value returned before evaluation completes or if evaluation fails.
- \`context\` (EvaluationContext, optional): Optional context override for this evaluation.

### \`useEvaluate({ context }?)\`
Returns \`{ data: EvaluationResponse | null, error: Error | null, isLoading: boolean, refresh: () => Promise<EvaluationResponse> }\`.

### \`useFlagClient(): Flaggable\`
Returns the underlying \`Flaggable\` client instance. Use \`client.setEvaluationContext({ context: { ... } })\` or \`client.refresh()\` directly.

---

## Context & Targeting

Flaggable automatically manages an anonymous device identifier in browser cookies (\`flaggable_anonymous_id\`).

To target specific users, roles, or attributes:
\`\`\`tsx
// Set evaluation context on client
const client = useFlagClient();
client.setEvaluationContext({ context: { userId: user.id, role: user.role } });

// Or override per flag evaluation
const isBetaUser = useFlag({
  flagName: "beta-ui",
  fallbackValue: false,
  context: { userId: user.id, role: user.role },
});
\`\`\`

---

## Vanilla JavaScript / TypeScript Client (\`@flaggable/sdk\`)

\`\`\`ts
import { Flaggable } from "@flaggable/sdk";

const flaggable = new Flaggable({
  publicKey: "pk_...",
});

const isEnabled = await flaggable.get({ flagName: "feature-flag", fallbackValue: false });

// Listen for updates ('change', 'contextChange', 'error')
const unsubscribe = flaggable.on({
  event: "change",
  listener: ({ response }) => {
    console.log("Flags updated:", response.evaluations);
  },
});
\`\`\`

---

## Type Generation (\`flaggable typegen\`)

Generate TypeScript definitions from your project's flag schemas:

\`\`\`bash
# 1. Add internal API key to .env.local:
# FLAGGABLE_INTERNAL_API_KEY="ik_..."

# 2. Run typegen
npx flaggable typegen
\`\`\`

This creates \`flaggable.d.ts\` with module augmentation, providing autocomplete for flag names and automatic type inference in \`useFlag\` and \`client.get\`.
`;
