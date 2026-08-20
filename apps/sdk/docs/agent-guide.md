# Flaggable SDK - AI Agent Developer Integration Guide

This guide provides instructions and code patterns for AI coding agents (such as Cursor, Windsurf, Claude Code, Pi, Copilot, ChatGPT) integrating `@flaggable/sdk` into web applications.

---

## 1. Package Overview

- **Package Name**: `@flaggable/sdk`
- **Peer Dependencies**: `react` (>= 18), `react-dom` (>= 18)
- **Primary Subpaths**:
  - `@flaggable/sdk/react`: React hooks & context provider (`FlagProvider`, `useFlag`, `useEvaluate`, `useFlagClient`).
  - `@flaggable/sdk` or `@flaggable/sdk/core`: Vanilla JS/TS client (`Flaggable`, `createFlaggable`).

---

## 2. Next.js App Router Integration Recipe (Standard Pattern)

When asked to add Flaggable to a Next.js project using App Router (`app/` directory), follow these 4 steps:

### Step 2.1: Add Environment Variables

In `.env.local` (and add example keys to `.env.example`):

```env
NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY="<PUBLIC_KEY>"
FLAGGABLE_INTERNAL_API_KEY="<INTERNAL_KEY>"
```

### Step 2.2: Generate TypeScript Types

Run typegen to create `flaggable.d.ts` for full type inference and autocomplete:

```bash
npx flaggable typegen
```

### Step 2.3: Create Client Provider Component

Create `components/flaggable-provider.tsx` (or `app/providers.tsx`):

```tsx
"use client";

import type { ReactNode } from "react";
import { FlagProvider } from "@flaggable/sdk/react";

export function FlaggableClientProvider({ children }: { children: ReactNode }) {
  const publicKey = process.env.NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY;

  // Fallback gracefully if keys are missing (prevents crash in preview/build)
  if (!publicKey) {
    return <>{children}</>;
  }

  return (
    <FlagProvider publicKey={publicKey} pollInterval={30000}>
      {children}
    </FlagProvider>
  );
}
```

### Step 2.4: Wrap the Root Layout

In `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { FlaggableClientProvider } from "@/components/flaggable-provider";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <FlaggableClientProvider>{children}</FlaggableClientProvider>
      </body>
    </html>
  );
}
```

### Step 2.5: Use Flags in UI Components

In any client component (`"use client"`):

```tsx
"use client";

import { useFlag } from "@flaggable/sdk/react";

export function Feature() {
  const isEnabled = useFlag({ flagName: "<flag-name>", fallbackValue: false });

  if (!isEnabled) {
    return null;
  }

  return <div>Feature is currently enabled!</div>;
}
```

---

## 3. Demo / Verification Component Recipe

When asked to verify the feature flag integration or create a visual toggle indicator, create `components/flaggable-demo.tsx`:

```tsx
"use client";

import { useFlag, useFlagClient } from "@flaggable/sdk/react";
import { useState } from "react";

export function FlaggableDemo({ flagName = "my-first-flag" }: { flagName?: string }) {
  const isEnabled = useFlag({ flagName, fallbackValue: false });
  const client = useFlagClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await client.refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all my-4 shadow-sm ${
        isEnabled
          ? "bg-emerald-50 border-emerald-200 text-emerald-950"
          : "bg-zinc-50 border-zinc-200 text-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block size-2.5 rounded-full ${isEnabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flaggable Live Status
            </span>
          </div>
          <h4 className="text-sm font-medium">
            Flag:{" "}
            <code className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs">
              {flagName}
            </code>
          </h4>
          <p className="text-xs text-muted-foreground">
            Current evaluation:{" "}
            <strong className={isEnabled ? "text-emerald-600" : "text-zinc-600"}>
              {isEnabled ? "ON (True)" : "OFF (False)"}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="text-xs px-2.5 py-1.5 rounded-md border bg-white shadow-xs hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Sync now"}
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Next.js Pages Router Integration

For projects using `pages/_app.tsx`:

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";
import { FlagProvider } from "@flaggable/sdk/react";

export default function App({ Component, pageProps }: AppProps) {
  const publicKey = process.env.NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_FLAGGABLE_BASE_URL ?? "";

  return (
    <FlagProvider publicKey={publicKey} baseUrl={baseUrl}>
      <Component {...pageProps} />
    </FlagProvider>
  );
}
```

---

## 5. Non-React / Backend / Script Integration

For Node.js scripts, API routes, or edge middleware:

```ts
import { Flaggable } from "@flaggable/sdk";

const flaggable = new Flaggable({
  publicKey: process.env.FLAGGABLE_PUBLIC_KEY!,
  baseUrl: process.env.FLAGGABLE_BASE_URL!,
});

// Single evaluate
const isAllowed = await flaggable.get({
  flagName: "beta-access",
  fallbackValue: false,
  context: { userId: "user_456" },
});

// Evaluate batch
const result = await flaggable.evaluate({
  context: { userId: "user_456", country: "US" },
});
```

---

## 6. Rules for Coding Agents

1. **Object Parameters**: Always use object parameters for SDK methods and hooks (e.g. `useFlag({ flagName, fallbackValue })`, `client.get({ flagName, fallbackValue })`, `client.setEvaluationContext({ context })`).
2. **Never hardcode public keys or base URLs** in application code; always read from `process.env.NEXT_PUBLIC_*`.
3. **Always include a fallback value** matching the expected type when calling `useFlag({ flagName, fallbackValue })`.
4. **Use `"use client"`** at the top of any file containing `useFlag`, `useEvaluate`, or `FlagProvider`.
5. **Wrap at the highest viable client boundary** so that all nested components share flag caching and polling.
