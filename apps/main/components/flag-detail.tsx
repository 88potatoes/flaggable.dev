"use client";

import type { Flag } from "@flaggable/contracts";

import { ConditionList } from "./condition-list";

export function FlagDetail({
  flag,
  onOpenAgentPrompt,
}: {
  flag?: Flag;
  onOpenAgentPrompt?: () => void;
}) {
  if (!flag) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-1)]">
        <div className="text-center">
          <div className="mb-3 text-[var(--text-subtle)]">
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
          <p className="font-medium text-[var(--text-primary)]">Select a flag</p>
          <p className="text-sm text-[var(--text-muted)]">
            Choose a flag from the browser to view details
          </p>
        </div>
      </div>
    );
  }

  return <ConditionList flag={flag} onOpenAgentPrompt={onOpenAgentPrompt} />;
}
