"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore(), {
      rootMargin: "160px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, onLoadMore]);

  return (
    <Card className="flag-browser gap-0 overflow-hidden p-0">
      <div className="flag-browser-toolbar">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Feature Flags</h2>
          <p className="text-sm text-gray-600">Manage and control your feature releases</p>
        </div>
        <Label htmlFor="flag-search" className="sr-only">
          Search flags
        </Label>
        <div className="search-field">
          <Search className="h-4 w-4" aria-hidden="true" />
          <Input
            id="flag-search"
            placeholder="Search flags by name..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
      <div className="flag-browser-list" aria-busy={isLoading}>
        {isLoading ? (
          Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="mx-4 my-2 h-14" />
          ))
        ) : flags.length === 0 ? (
          <div className="flag-browser-empty py-12 text-center">
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
              className={`flag-browser-item relative ${selectedFlagId === flag.id ? "is-selected" : ""}`}
              aria-pressed={selectedFlagId === flag.id}
              onClick={() => onSelect(flag.id)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
                    flag.enabled
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : "bg-gradient-to-br from-gray-400 to-gray-500"
                  }`}
                >
                  {flag.name[0]?.toUpperCase() || "F"}
                </div>
                <span className="grid min-w-0 gap-1.5 text-left">
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
    </Card>
  );
}
