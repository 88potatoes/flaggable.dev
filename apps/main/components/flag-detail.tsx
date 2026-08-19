"use client";

import { Trash2 } from "lucide-react";
import type { Flag } from "@flaggable/contracts";

import { Button } from "@flaggable/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flaggable/ui/card";
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
      <Card className="overflow-hidden border bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50/80 to-white/60 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Flag Configuration
              </CardTitle>
              <CardDescription className="mt-1">
                Manage global settings and behavior
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Switch
                checked={flag.enabled}
                onCheckedChange={(enabled: boolean) =>
                  updateFlag.mutate({ flagId: flag.id, values: { enabled } })
                }
                aria-label={`Toggle ${flag.name}`}
              />
              <span
                className={`text-xs font-medium ${
                  flag.enabled ? "text-green-600" : "text-gray-500"
                }`}
              >
                {flag.enabled ? "Globally Active" : "Globally Inactive"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 rounded-lg bg-gradient-to-r from-gray-50/80 to-white/60 p-4">
            <dl className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Schema Type
                </dt>
                <dd className="text-sm font-medium text-gray-900">Value schema</dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Global State
                </dt>
                <dd
                  className={`text-sm font-semibold ${
                    flag.enabled ? "text-green-700" : "text-gray-600"
                  }`}
                >
                  {flag.enabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </dt>
                <dd>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => archiveFlag.mutate({ flagId: flag.id })}
                    disabled={archiveFlag.isPending}
                    className="bg-red-500 hover:bg-red-600 focus:ring-red-500/20"
                  >
                    <Trash2 className="mr-2 h-3 w-3" /> Archive
                  </Button>
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>
      <ConditionList flag={flag} />
    </div>
  );
}
