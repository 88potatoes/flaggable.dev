"use client";

import { Trash2 } from "lucide-react";
import type { Flag } from "@flaggable/contracts";

import { Button } from "@flaggable/ui/button";
import { Card } from "@flaggable/ui/card";
import { Switch } from "@flaggable/ui/switch";
import { useMutateUpdateFlag, useMutateArchiveFlag } from "@/slices/flags/queries";
import { ConditionList } from "./condition-list";

export function FlagDetail({ flag, projectId }: { flag?: Flag; projectId: string }) {
  const updateFlag = useMutateUpdateFlag(projectId);
  const archiveFlag = useMutateArchiveFlag(projectId);

  if (!flag) {
    return (
      <Card className="flag-detail-empty">
        <p>Select a flag to view its details.</p>
      </Card>
    );
  }

  return (
    <div className="flag-detail-stack">
      <Card className="flag-detail-panel">
        <div className="flag-detail-heading">
          <div>
            <p className="inspector-label">FLAG</p>
            <h2>{flag.name}</h2>
            <p>{flag.description ?? "No description yet."}</p>
          </div>
          <Switch
            checked={flag.enabled}
            onCheckedChange={(enabled) =>
              updateFlag.mutate({ flagId: flag.id, values: { enabled } })
            }
            aria-label={`Toggle ${flag.name}`}
          />
        </div>
        <dl className="flag-detail-meta">
          <div>
            <dt>Type</dt>
            <dd>Value schema</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{flag.enabled ? "Enabled" : "Off"}</dd>
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
      </Card>
      <ConditionList flag={flag} />
    </div>
  );
}
