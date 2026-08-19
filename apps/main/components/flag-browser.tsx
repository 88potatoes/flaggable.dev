"use client";

import { useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { LoaderCircle, Search } from "lucide-react";

import { Badge } from "@flaggable/ui/badge";
import { Card } from "@flaggable/ui/card";
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
        case "Escape":
          event.preventDefault();
          searchInputRef.current?.focus();
          return;
        case "/":
          event.preventDefault();
          searchInputRef.current?.focus();
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
    if (containerRef.current && !searchInputRef.current?.matches(":focus")) {
      containerRef.current.focus();
    }
  }, [selectedFlagId]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col bg-white focus:outline focus:outline-2 focus:outline-[rgba(240,100,69,0.2)] focus:-outline-offset-2 overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="border-b border-sidebar-border bg-gradient-to-r from-white/80 to-gray-50/60 p-3">
        <div className="mb-3">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Feature Flags</h2>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {flags.length} flag{flags.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <Label htmlFor="flag-search" className="sr-only">
          Search flags
        </Label>
        <div className="relative flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 transition-colors focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200">
          <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            ref={searchInputRef}
            id="flag-search"
            placeholder="Search flags (press / to focus)..."
            value={search}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(event.target.value)
            }
            className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:outline-none"
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
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {search ? "No matching flags" : "No flags yet"}
            </p>
            <p className="text-xs text-gray-500">
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
              className={`relative flex w-full items-center justify-between gap-2 rounded-lg border p-2.5 text-left transition-all duration-150 ease-out focus:outline-none ${
                selectedFlagId === flag.id
                  ? "border-[rgba(240,100,69,0.24)] bg-gradient-to-br from-orange-50 to-orange-50/50 shadow-sm before:absolute before:-left-2 before:top-1/2 before:h-[70%] before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-gradient-to-b before:from-[var(--accent)] before:to-[var(--accent-deep)] before:content-['']"
                  : "border-transparent hover:border-[rgba(240,100,69,0.12)] hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-50/50 hover:-translate-y-px"
              }`}
              aria-pressed={selectedFlagId === flag.id}
              onClick={() => onSelect(flag.id)}
              onFocus={() => onSelect(flag.id)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white ${
                    flag.enabled
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : "bg-gradient-to-br from-gray-400 to-gray-500"
                  }`}
                >
                  {flag.name[0]?.toUpperCase() || "F"}
                </div>
                <span className="grid min-w-0 gap-1 text-left">
                  <strong className="truncate font-semibold text-gray-900">{flag.name}</strong>
                  <span className="truncate text-xs text-gray-500">
                    {flag.description ?? "No description yet."}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={flag.enabled ? "default" : "secondary"}
                  className={
                    flag.enabled
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                  }
                >
                  {flag.enabled ? "On" : "Off"}
                </Badge>
              </div>
            </button>
          ))
        )}
        <div ref={sentinelRef} className="h-2" aria-hidden="true" />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <LoaderCircle
              className="h-5 w-5 animate-spin text-gray-400"
              aria-label="Loading more flags"
            />
            <span className="ml-2 text-sm text-gray-500">Loading more flags...</span>
          </div>
        )}
      </div>
    </div>
  );
}
