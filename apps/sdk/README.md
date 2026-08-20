# @flaggable/sdk

Type-safe, reactive feature flag SDK for JavaScript, TypeScript, React, and Next.js applications.

[![npm version](https://img.shields.io/npm/v/@flaggable/sdk.svg)](https://www.npmjs.com/package/@flaggable/sdk)
[![License](https://img.shields.io/npm/l/@flaggable/sdk.svg)](https://github.com/flaggable-dev/flaggable)

## Quick Start (Next.js App Router)

### 1. Install

```bash
npm install @flaggable/sdk
# or
pnpm add @flaggable/sdk
# or
yarn add @flaggable/sdk
```

### 2. Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_FLAGGABLE_BASE_URL="https://flaggable.dev"
NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY="pk_your_project_public_key"
```

### 3. Create Client Provider (`components/flaggable-provider.tsx`)

```tsx
"use client";

import type { ReactNode } from "react";
import { FlagProvider } from "@flaggable/sdk/react";

export function FlaggableClientProvider({ children }: { children: ReactNode }) {
  const publicKey = process.env.NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_FLAGGABLE_BASE_URL ?? "https://flaggable.dev";

  if (!publicKey) {
    return <>{children}</>;
  }

  return (
    <FlagProvider publicKey={publicKey} baseUrl={baseUrl} pollInterval={30000}>
      {children}
    </FlagProvider>
  );
}
```

### 4. Wrap Root Layout (`app/layout.tsx`)

```tsx
import type { Metadata } from "next";
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
```

### 5. Use Flags in Any Client Component

```tsx
"use client";

import { useFlag } from "@flaggable/sdk/react";

export function Banner() {
  const showBanner = useFlag("show-banner", false);

  if (!showBanner) return null;

  return (
    <div className="bg-orange-500 text-white p-3 rounded text-center">
      🎉 Welcome to the new feature!
    </div>
  );
}
```

---

## React & Next.js Hooks API (`@flaggable/sdk/react`)

### `FlagProvider`

Context provider that manages the Flaggable client lifecycle, evaluation caching, and polling.

```tsx
<FlagProvider
  publicKey="pk_..."
  baseUrl="https://flaggable.dev"
  pollInterval={30000} // optional, in ms (default: 30000)
  context={{ userId: "123", plan: "pro" }} // optional initial context
>
  {children}
</FlagProvider>
```

### `useFlag<T>(flagName: string, fallbackValue: T, context?: EvaluationContext): T`

React hook returning the reactive value of a feature flag. Automatically re-evaluates when flags change on the server or polling updates.

```tsx
const isNewCheckout = useFlag("new-checkout", false);
const maxItems = useFlag<number>("cart-limit", 10);
const brandTheme = useFlag<string>("theme-color", "blue", { role: "admin" });
```

### `useEvaluate(context?: EvaluationContext)`

Hook returning the raw evaluation response payload, loading state, error, and a manual `refresh()` method.

```tsx
const { data, error, isLoading, refresh } = useEvaluate();
```

### `useFlagClient(): Flaggable`

Accesses the underlying `Flaggable` core instance to manipulate context directly.

```tsx
const client = useFlagClient();

function handleLogin(user: { id: string; email: string }) {
  client.setContext({ userId: user.id, email: user.email });
}
```

---

## Core TypeScript / JavaScript Client (`@flaggable/sdk` or `@flaggable/sdk/core`)

For Node.js, vanilla browser JS, or non-React frameworks:

```ts
import { Flaggable } from "@flaggable/sdk";

const flaggable = new Flaggable({
  publicKey: "pk_...",
  baseUrl: "https://flaggable.dev",
  pollInterval: 30000,
});

// Single flag evaluation with fallback
const isEnabled = await flaggable.get("new-feature", false);

// Evaluate all flags
const response = await flaggable.evaluate({ userId: "user_123" });
console.log(response.evaluations);

// Subscribe to real-time changes
const unsubscribe = flaggable.subscribe((response) => {
  console.log("Flags updated:", response.evaluations);
});

// Cleanup
flaggable.destroy();
```

---

## Context & Targeting

The SDK automatically assigns and persists an anonymous ID cookie (`flaggable_anonymous_id`) in browser environments.

You can supply additional custom attributes for targeting rules (e.g. user ID, role, plan, region):

```tsx
// Global context on provider:
<FlagProvider publicKey={key} baseUrl={url} context={{ env: "staging", team: "core" }}>
  {children}
</FlagProvider>;

// Per-hook context override:
const featureActive = useFlag("beta-flow", false, {
  userId: currentUser.id,
  role: currentUser.role,
});
```

---

## Agent Guide & Best Practices

When configuring AI coding agents (Cursor, Claude Code, Pi, Windsurf, Copilot):

1. **Client Components**: Always mark components using `useFlag` with `"use client"`.
2. **Always Provide Fallbacks**: Always pass a realistic default fallback value (`false`, `""`, `0`, or default object).
3. **Single Provider**: Wrap your application once at the root level (`app/layout.tsx` or `_app.tsx`). Do not nest multiple `FlagProvider`s.
4. **Environment Variables**: Use `NEXT_PUBLIC_` prefix in Next.js so variables are accessible in the browser runtime.

For complete Agent documentation, see [docs/agent-guide.md](./docs/agent-guide.md).
