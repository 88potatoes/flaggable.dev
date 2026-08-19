"use client";

import { Trash2 } from "lucide-react";
import type { Flag } from "@flaggable/contracts";

import { Button } from "@flaggable/ui/button";

import { Switch } from "@flaggable/ui/switch";
import { useMutateUpdateFlag, useMutateArchiveFlag } from "@/slices/flags/queries";
import { ConditionList } from "./condition-list";

export function FlagDetail({ flag, projectId }: { flag?: Flag; projectId: string }) {
  const updateFlag = useMutateUpdateFlag(projectId);
  const archiveFlag = useMutateArchiveFlag(projectId);

  if (!flag) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="text-center">
          <div className="mb-3 text-gray-400">
            <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 5a2 2 0 012-2h4a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="font-medium text-gray-600">Select a flag</p>
          <p className="text-sm text-gray-500">Choose a flag from the browser to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{flag.name}</h1>
          <p className="mt-1 text-sm text-gray-600">{flag.description || "No description yet."}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>Schema: Value schema</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-2">
            <Switch
              checked={flag.enabled}
              onCheckedChange={(enabled: boolean) =>
                updateFlag.mutate({ flagId: flag.id, values: { enabled } })
              }
              aria-label={`Toggle ${flag.name}`}
            />
            <span
              className={`text-xs font-medium ${flag.enabled ? "text-green-600" : "text-gray-500"}`}
            >
              {flag.enabled ? "Active" : "Inactive"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => archiveFlag.mutate({ flagId: flag.id })}
            disabled={archiveFlag.isPending}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-3 w-3" /> Archive
          </Button>
        </div>
      </div>
      <ConditionList flag={flag} />
    </div>
  );
}
