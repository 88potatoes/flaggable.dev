"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect } from "react";

export function AuthWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isLoading, error } = useUser();

  useEffect(() => {
    if (isLoading || user || window.location.pathname.startsWith("/auth/")) return;

    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [error, isLoading, user]);

  if (isLoading || !user) {
    return (
      <main className="auth-loading" aria-busy="true" aria-live="polite">
        <div className="auth-loading-mark">
          f<span>.</span>
        </div>
        <p>{error ? "Redirecting to sign in…" : "Checking your session…"}</p>
      </main>
    );
  }

  return children;
}

export const AuthProvider = AuthWrapper;
