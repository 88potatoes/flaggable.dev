"use client";

import { useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { LoaderCircle, Search } from "lucide-react";

import { Input } from "@flaggable/ui/input";
import { Label } from "@flaggable/ui/label";
import { Skeleton } from "@flaggable/ui/skeleton";
import type { Flag } from "@flaggable/contracts";

export function FlagBrowser({
  flags,
  search,
  onSearchChange,
  selectedFlagId,
  onSelect,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: {
  flags: Flag[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedFlagId?: string;
  onSelect: (flagId: string) => void;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore(), {
      rootMargin: "160px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, onLoadMore]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (flags.length === 0) return;

      const currentIndex = selectedFlagId
        ? flags.findIndex((flag) => flag.id === selectedFlagId)
        : -1;
      let nextIndex = currentIndex;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          nextIndex = currentIndex < flags.length - 1 ? currentIndex + 1 : 0;
          break;
        case "ArrowUp":
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : flags.length - 1;
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (currentIndex >= 0) {
            onSelect(flags[currentIndex].id);
          }
          return;
        default:
          return;
      }

      if (nextIndex >= 0 && nextIndex < flags.length) {
        onSelect(flags[nextIndex].id);
      }
    },
    [flags, selectedFlagId, onSelect],
  );

  // Focus management and auto-select first flag
  useEffect(() => {
    if (flags.length > 0 && !selectedFlagId) {
      onSelect(flags[0].id);
    }
  }, [flags, selectedFlagId, onSelect]);

  useEffect(() => {
    containerRef.current?.focus();
  }, [selectedFlagId]);

  return (
    <div
      ref={containerRef}
      className="flag-browser-root flex h-full w-full flex-col overflow-hidden bg-[var(--surface-1)] text-[var(--text-primary)] outline-none focus:outline-none focus-visible:outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="grid gap-1.5 border-b border-[var(--line)] px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-medium text-[var(--text-subtle)]">
            {flags.length} flag{flags.length !== 1 ? "s" : ""}
          </span>
          <span className="text-[0.625rem] text-[var(--text-subtle)]">/ to search</span>
        </div>
        <Label htmlFor="flag-search" className="sr-only">
          Search flags
        </Label>
        <div className="flex h-7 items-center gap-1.5 rounded border border-[var(--line)] bg-[var(--surface-0)] px-2 transition-colors focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent-soft)]">
          <Search className="size-3.5 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
          <Input
            ref={searchInputRef}
            id="flag-search"
            placeholder="Search flags"
            value={search}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(event.target.value)
            }
            className="h-6 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 focus-visible:outline-none"
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "ArrowDown" && flags.length > 0) {
                event.preventDefault();
                containerRef.current?.focus();
                onSelect(flags[0].id);
              }
            }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2" aria-busy={isLoading}>
        {isLoading ? (
          Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="mx-2 my-1 h-12" />
          ))
        ) : flags.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {search ? "No matching flags" : "No flags yet"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {search
                ? "Try adjusting your search terms"
                : "Create your first feature flag to get started"}
            </p>
          </div>
        ) : (
          flags.map((flag) => (
            <button
              type="button"
              key={flag.id}
              className={`relative flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors duration-150 ease-out focus:outline-none ${
                selectedFlagId === flag.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] before:absolute before:-left-2 before:top-1/2 before:h-[70%] before:w-0.5 before:-translate-y-1/2 before:bg-[var(--accent)] before:content-['']"
                  : flag.enabled
                    ? "border-transparent hover:border-[var(--line)] hover:bg-[var(--surface-2)]"
                    : "border-transparent opacity-60 hover:border-[var(--line)] hover:bg-[var(--surface-2)] hover:opacity-100"
              }`}
              aria-pressed={selectedFlagId === flag.id}
              onClick={() => onSelect(flag.id)}
              onFocus={() => onSelect(flag.id)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="grid min-w-0 gap-0.5 text-left">
                  <strong className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {flag.name}
                  </strong>
                  {flag.description && (
                    <span className="truncate text-[0.6875rem] text-[var(--text-muted)]">
                      {flag.description}
                    </span>
                  )}
                </span>
              </div>
            </button>
          ))
        )}
        <div ref={sentinelRef} className="h-2" aria-hidden="true" />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <LoaderCircle
              className="h-5 w-5 animate-spin text-[var(--accent)]"
              aria-label="Loading more flags"
            />
            <span className="ml-2 text-sm text-[var(--text-muted)]">Loading more flags...</span>
          </div>
        )}
      </div>
    </div>
  );
}
