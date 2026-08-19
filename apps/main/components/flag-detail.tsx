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
    <div className="grid min-w-0 gap-6">
      <Card className="gap-0 overflow-hidden border-0 bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 shadow-xl ring-1 ring-gray-200/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 bg-gradient-to-r from-white/80 to-gray-50/60 pb-6">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-600 text-xs font-bold text-white">
                F
              </div>
              <p className="text-[0.6rem] font-bold tracking-[0.12em] text-orange-600/80 uppercase">
                FEATURE FLAG
              </p>
            </div>
            <CardTitle className="text-xl font-semibold leading-tight tracking-tight text-gray-900">
              {flag.name}
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-gray-600">
              {flag.description ?? "No description yet."}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Switch
              checked={flag.enabled}
              onCheckedChange={(enabled) =>
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
        </CardHeader>
        <CardContent className="grid gap-6 pt-0">
          <div className="grid gap-4 rounded-lg bg-gradient-to-r from-gray-50/80 to-white/60 p-4">
            <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-1.5">
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                  Type
                </dt>
                <dd className="text-sm font-medium text-gray-900">Value schema</dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </dt>
                <dd
                  className={`text-sm font-semibold ${flag.enabled ? "text-green-700" : "text-gray-600"}`}
                >
                  {flag.enabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex justify-start">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => archiveFlag.mutate({ flagId: flag.id })}
              disabled={archiveFlag.isPending}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500/20"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Archive flag
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="rounded-xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 p-1 shadow-lg ring-1 ring-gray-200/40">
        <div className="rounded-lg bg-white/80 backdrop-blur-sm">
          <ConditionList flag={flag} />
        </div>
      </div>
    </div>
  );
}
