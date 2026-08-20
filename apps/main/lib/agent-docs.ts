/**
 * Documentation content and prompt generators for AI coding agents integrating @flaggable/sdk.
 */

export interface AgentPromptOptions {
  baseUrl: string;
  publicKey: string;
  flagName: string;
  projectName?: string;
}

export function generateAgentPrompt({
  baseUrl,
  publicKey,
  flagName,
  projectName,
}: AgentPromptOptions): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const docsUrl = `${cleanBaseUrl}/docs/sdk.md`;

  return `Set up the @flaggable/sdk feature flag SDK in this Next.js project.

### Configuration
- Package: \`@flaggable/sdk\`
- Flaggable Base URL: \`${cleanBaseUrl}\`
- Public Key: \`${publicKey}\`
- Target Feature Flag: \`${flagName}\`${projectName ? `\n- Project: \`${projectName}\`` : ""}
- SDK Documentation: \`${docsUrl}\`

### Implementation Steps

1. **Install the SDK**:
   Run: \`pnpm add @flaggable/sdk\` (or \`npm install @flaggable/sdk\`)

2. **Configure Environment Variables**:
   In \`.env.local\`:
   \`\`\`env
   NEXT_PUBLIC_FLAGGABLE_BASE_URL="${cleanBaseUrl}"
   NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY="${publicKey}"
   \`\`\`

3. **Create the Flaggable Provider Component**:
   Create \`components/flaggable-provider.tsx\` (or \`app/providers.tsx\`):
   \`\`\`tsx
   "use client";

   import type { ReactNode } from "react";
   import { FlagProvider } from "@flaggable/sdk/react";

   export function FlaggableClientProvider({ children }: { children: ReactNode }) {
     const publicKey = process.env.NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY;
     const baseUrl = process.env.NEXT_PUBLIC_FLAGGABLE_BASE_URL;

     if (!publicKey || !baseUrl) {
       return <>{children}</>;
     }

     return (
       <FlagProvider publicKey={publicKey} baseUrl={baseUrl} pollInterval={30000}>
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
     const isEnabled = useFlag("${flagName}", false);
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
NEXT_PUBLIC_FLAGGABLE_BASE_URL="https://flaggable.dev"
NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY="pk_your_project_public_key"
\`\`\`

### 2. Client Provider (\`components/flaggable-provider.tsx\`)
\`\`\`tsx
"use client";

import type { ReactNode } from "react";
import { FlagProvider } from "@flaggable/sdk/react";

export function FlaggableClientProvider({ children }: { children: ReactNode }) {
  const publicKey = process.env.NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_FLAGGABLE_BASE_URL ?? "https://flaggable.dev";

  if (!publicKey) return <>{children}</>;

  return (
    <FlagProvider publicKey={publicKey} baseUrl={baseUrl} pollInterval={30000}>
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
  const isNewCheckout = useFlag("new-checkout-flow", false);

  if (isNewCheckout) {
    return <button className="bg-emerald-600 text-white px-4 py-2 rounded">New 1-Click Checkout</button>;
  }

  return <button className="bg-zinc-800 text-white px-4 py-2 rounded">Standard Checkout</button>;
}
\`\`\`

---

## React API Reference (\`@flaggable/sdk/react\`)

### \`<FlagProvider>\`
Props:
- \`publicKey\` (string, required): The public SDK key from your Flaggable project.
- \`baseUrl\` (string, optional): The Flaggable host URL (default: \`https://flaggable.dev\`).
- \`pollInterval\` (number, optional): Polling interval in ms (default: \`30000\`).

### \`useFlag<T>(flagName: string, fallbackValue: T, context?: EvaluationContext): T\`
Returns the reactive evaluation for the given flag name. Automatically re-evaluates when polling receives new evaluations.

### \`useEvaluate(context?: EvaluationContext)\`
Returns \`{ data: EvaluationResponse | null, error: Error | null, isLoading: boolean, refresh: () => Promise<EvaluationResponse> }\`.

### \`useFlagClient(): Flaggable\`
Returns the underlying \`Flaggable\` client instance. Use \`client.setEvaluationContext({ ... })\` or \`client.refresh()\` directly.

---

## Context & Targeting

Flaggable automatically manages an anonymous device identifier in browser cookies (\`flaggable_anonymous_id\`).

To target specific users, roles, or attributes:
\`\`\`tsx
// Set evaluation context on client
const client = useFlagClient();
client.setEvaluationContext({ userId: user.id, role: user.role });

// Or override per flag evaluation
const isBetaUser = useFlag("beta-ui", false, { userId: user.id, role: user.role });
\`\`\`

---

## Vanilla JavaScript / TypeScript Client (\`@flaggable/sdk\`)

\`\`\`ts
import { Flaggable } from "@flaggable/sdk";

const flaggable = new Flaggable({
  publicKey: "pk_...",
  baseUrl: "https://flaggable.dev",
});

const isEnabled = await flaggable.get("feature-flag", false);
\`\`\`
`;
