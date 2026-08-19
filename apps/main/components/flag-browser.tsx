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
        <Label htmlFor="flag-search" className="sr-only">
          Search flags
        </Label>
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            id="flag-search"
            placeholder="Search flags"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
      <div className="flag-browser-list" aria-busy={isLoading}>
        {isLoading ? (
          Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="mx-4 my-2 h-14" />
          ))
        ) : flags.length === 0 ? (
          <p className="flag-browser-empty">
            {search ? "No flags match your search." : "No flags yet."}
          </p>
        ) : (
          flags.map((flag) => (
            <button
              type="button"
              key={flag.id}
              className={`flag-browser-item ${selectedFlagId === flag.id ? "is-selected" : ""}`}
              aria-pressed={selectedFlagId === flag.id}
              onClick={() => onSelect(flag.id)}
            >
              <span className="grid min-w-0 gap-1 text-left">
                <strong className="truncate">{flag.name}</strong>
                <span className="truncate text-xs text-muted-foreground">
                  {flag.description ?? "No description yet."}
                </span>
              </span>
              <Badge variant={flag.enabled ? "default" : "secondary"}>
                {flag.enabled ? "On" : "Off"}
              </Badge>
            </button>
          ))
        )}
        <div ref={sentinelRef} className="h-2" aria-hidden="true" />
        {isFetchingNextPage && (
          <LoaderCircle
            className="mx-auto mb-3 size-4 animate-spin text-muted-foreground"
            aria-label="Loading more flags"
          />
        )}
      </div>
    </Card>
  );
}
