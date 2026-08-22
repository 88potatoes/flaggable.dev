"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@flaggable/ui/sonner";
import { ApiClientError, getApiErrorMessage } from "@/slices/http";
import { TooltipProvider } from "@flaggable/ui/tooltip";

type ErrorToastMeta = {
  skipErrorToast?: boolean;
  errorToastTitle?: string;
};

function shouldSkipErrorToast(error: unknown, meta: unknown) {
  if (error instanceof ApiClientError && error.code === "flag_name_conflict") return true;
  return Boolean(
    meta &&
    typeof meta === "object" &&
    "skipErrorToast" in meta &&
    (meta as ErrorToastMeta).skipErrorToast === true,
  );
}

function errorToastTitle(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return "Sign-in required";
    if (error.status === 403) return "Permission denied";
    if (error.status === 404) return "Not found";
    if (error.status === 409) return "Could not complete request";
  }
  return fallback;
}

function showQueryError(error: unknown, fallbackTitle: string) {
  toast.error(errorToastTitle(error, fallbackTitle), {
    description: getApiErrorMessage(error, "Please try again."),
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (shouldSkipErrorToast(error, query.options.meta)) return;
            showQueryError(error, "Could not load data");
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            const meta = mutation.options.meta as ErrorToastMeta | undefined;
            if (shouldSkipErrorToast(error, meta)) return;
            showQueryError(error, meta?.errorToastTitle ?? "Could not save changes");
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              if (error instanceof ApiClientError && error.status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
