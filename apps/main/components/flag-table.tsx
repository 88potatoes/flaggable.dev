"use client";

import type { KeyboardEvent } from "react";
import { ArrowUpRight } from "lucide-react";

import type { Flag as FlagRecord } from "@flaggable/contracts";
import { Badge } from "@flaggable/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@flaggable/ui/table";

type FlagTableProps = {
  flags: FlagRecord[];
  selectedFlagId?: string;
  onSelect: (flagId: string) => void;
  isLoading: boolean;
  emptyMessage: string;
};

export function FlagTable({
  flags,
  selectedFlagId,
  onSelect,
  isLoading,
  emptyMessage,
}: FlagTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Flag</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={4}>Loading flags…</TableCell>
          </TableRow>
        ) : flags.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4}>{emptyMessage}</TableCell>
          </TableRow>
        ) : (
          flags.map((flag) => {
            const isSelected = selectedFlagId === flag.id;
            return (
              <TableRow
                className={isSelected ? "bg-accent/10" : ""}
                key={flag.id}
                data-state={isSelected ? "selected" : undefined}
                onClick={() => onSelect(flag.id)}
                tabIndex={0}
                onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(flag.id);
                  }
                }}
              >
                <TableCell className="flex items-center gap-2.5">
                  <i className={`status-dot ${flag.enabled ? "green" : "purple"}`} />
                  <span>
                    <b>{flag.name}</b>
                    <small>{flag.description ?? "No description yet."}</small>
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={flag.enabled ? "default" : "secondary"}
                    className={`rollout-pill ${flag.enabled ? "on" : "off"}`}
                  >
                    <i />
                    {flag.enabled ? "Enabled" : "Off"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatUpdated(flag.updatedAt)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  <ArrowUpRight />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - date.valueOf()) / 60000));
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}
