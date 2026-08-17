"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <main className="auth-loading" aria-busy="true" aria-live="polite">
        <div className="auth-loading-mark">
          f<span>.</span>
        </div>
        <p>Checking your session…</p>
      </main>
    );
  }

  return children;
}
