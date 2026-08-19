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
      <Card className="text-sm text-muted-foreground">
        <p>Select a flag to view its details.</p>
      </Card>
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      <Card className="gap-0">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-[0.5rem] font-extrabold tracking-[0.14em] text-[#c28373]">
              FLAG
            </p>
            <CardTitle>{flag.name}</CardTitle>
            <CardDescription className="mt-1">
              {flag.description ?? "No description yet."}
            </CardDescription>
          </div>
          <Switch
            checked={flag.enabled}
            onCheckedChange={(enabled) =>
              updateFlag.mutate({ flagId: flag.id, values: { enabled } })
            }
            aria-label={`Toggle ${flag.name}`}
          />
        </CardHeader>
        <CardContent className="grid gap-6 pt-0">
          <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="text-[0.7rem] uppercase text-[#9aa3a8]">Type</dt>
              <dd className="mt-1 text-sm">Value schema</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase text-[#9aa3a8]">Status</dt>
              <dd className="mt-1 text-sm">{flag.enabled ? "Enabled" : "Off"}</dd>
            </div>
          </dl>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => archiveFlag.mutate({ flagId: flag.id })}
            disabled={archiveFlag.isPending}
          >
            <Trash2 /> Archive flag
          </Button>
        </CardContent>
      </Card>
      <ConditionList flag={flag} />
    </div>
  );
}
