"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Settings, Lock, Unlock, AlertTriangle } from "lucide-react";
import type { ConditionOperator, Flag } from "@flaggable/contracts";

import { Button } from "@flaggable/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flaggable/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@flaggable/ui/dialog";
import { Input } from "@flaggable/ui/input";
import { Label } from "@flaggable/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flaggable/ui/select";
import {
  useMutateCreateCondition,
  useMutateUpdateCondition,
  useQueryConditions,
} from "@/slices/conditions/queries";
import { useQuerySchema } from "@/slices/value-schemas/queries";

export function ConditionList({
  flag,
  onOpenAgentPrompt,
}: {
  flag: Flag;
  onOpenAgentPrompt?: () => void;
}) {
  const [property, setProperty] = useState("");
  const [operator, setOperator] = useState<ConditionOperator>("equals");
  const [predicateValue, setPredicateValue] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [confirmationModal, setConfirmationModal] = useState<{
    type: "enable" | "disable" | "delete";
    conditionId: string;
    conditionProperty: string;
  } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const schemaQuery = useQuerySchema(flag.valueSchemaId);
  const isBooleanSchema = schemaQuery.data?.name === "Boolean";
  const conditionsQuery = useQueryConditions(flag.id);
  const conditions = conditionsQuery.data ?? [];
  const createCondition = useMutateCreateCondition(flag.id);
  const updateCondition = useMutateUpdateCondition(flag.id);
  const nextPosition = useMemo(
    () => Math.max(0, ...conditions.map((condition) => condition.position)) + 1,
    [conditions],
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedProperty = property.trim();
    if (!trimmedProperty) {
      toast.error("Property required", { description: "Enter a property name to continue." });
      return;
    }
    if (!predicateValue.trim()) {
      toast.error("Match value required", { description: "Enter a value to match." });
      return;
    }
    if (!isBooleanSchema && !resultValue.trim()) {
      toast.error("Return value required", {
        description: "Enter the value this condition should return.",
      });
      return;
    }
    createCondition.mutate(
      {
        position: nextPosition,
        property: trimmedProperty,
        operator,
        predicateValue: parseValue(predicateValue),
        resultValue: isBooleanSchema ? true : parseValue(resultValue),
      },
      {
        onSuccess: () => {
          setProperty("");
          setPredicateValue("");
          setResultValue("");
          setIsAdding(false);
        },
        onError: (error) =>
          toast.error("Could not create condition", {
            description: error.message || "Please try again.",
          }),
      },
    );
  }

  const handleConditionToggle = (
    conditionId: string,
    conditionProperty: string,
    currentEnabled: boolean,
  ) => {
    setConfirmationModal({
      type: currentEnabled ? "disable" : "enable",
      conditionId,
      conditionProperty,
    });
  };

  const executeConditionChange = () => {
    if (!confirmationModal) return;

    const enabled = confirmationModal.type === "enable";
    updateCondition.mutate(
      { conditionId: confirmationModal.conditionId, values: { enabled } },
      {
        onSuccess: () => setConfirmationModal(null),
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card className="gap-0 form-surface">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[var(--text-muted)]" />
            <CardTitle className="text-lg">Targeting Conditions</CardTitle>
          </div>
          <CardDescription>
            Control when this flag is enabled for different users and contexts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          {conditions.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-[var(--line)] p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)]">
                <Settings className="h-6 w-6 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                No conditions configured
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                This flag will evaluate to its default value ({flag.enabled ? "Active" : "Inactive"}
                ).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={condition.id}
                  className={`rounded-lg border p-4 transition-all ${
                    condition.enabled
                      ? "border-[var(--line)] bg-[var(--accent-soft)]/50"
                      : "border-[var(--line)] bg-[var(--surface-1)]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--surface-2)] text-xs font-bold">
                            {index + 1}
                          </span>
                          CONDITION
                        </span>
                        {condition.enabled ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-[var(--success)]">
                            <Unlock className="h-3 w-3" />
                            Active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)]">
                            <Lock className="h-3 w-3" />
                            Disabled
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-[var(--text-muted)]">When </span>
                          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-primary)]">
                            {condition.property}
                          </code>
                          <span className="text-[var(--text-muted)]"> {condition.operator} </span>
                          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs font-semibold text-[var(--blue)]">
                            {JSON.stringify(condition.predicateValue)}
                          </code>
                        </div>
                        <div className="text-sm">
                          <span className="text-[var(--text-muted)]">Return </span>
                          <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
                            {JSON.stringify(condition.resultValue)}
                          </code>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={condition.enabled ? "destructive" : "default"}
                        size="sm"
                        onClick={() =>
                          handleConditionToggle(condition.id, condition.property, condition.enabled)
                        }
                        className={
                          condition.enabled ? "" : "bg-[var(--success)] hover:bg-[var(--success)]"
                        }
                      >
                        {condition.enabled ? (
                          <>
                            <Lock className="mr-1 h-3 w-3" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Unlock className="mr-1 h-3 w-3" />
                            Enable
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <div className="border-t border-[var(--line)] px-6 pb-6 pt-4">
          {!isAdding ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Add new condition
            </Button>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <form className="form-stack" onSubmit={submit}>
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-4 w-4 text-[var(--text-muted)]" />
                    <Label htmlFor="condition-property" className="text-sm font-semibold">
                      New targeting condition
                    </Label>
                  </div>

                  <div className="form-section">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(10rem,0.9fr)]">
                      <div className="form-field">
                        <Label htmlFor="condition-property" className="form-label">
                          Property
                        </Label>
                        <Input
                          id="condition-property"
                          placeholder="e.g. country, userId"
                          value={property}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setProperty(event.target.value)
                          }
                          required
                          className="form-control-medium"
                        />
                      </div>
                      <div className="form-field">
                        <Label className="form-label">Operator</Label>
                        <Select
                          value={operator}
                          onValueChange={(value: string) => setOperator(value as ConditionOperator)}
                        >
                          <SelectTrigger
                            aria-label="Operator"
                            className="w-full form-control-medium"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">equals</SelectItem>
                            <SelectItem value="not_equals">not equals</SelectItem>
                            <SelectItem value="in">is in</SelectItem>
                            <SelectItem value="not_in">not in</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="form-field">
                        <Label htmlFor="condition-match-value" className="form-label">
                          Match value
                        </Label>
                        <Input
                          id="condition-match-value"
                          placeholder="Value to match"
                          value={predicateValue}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setPredicateValue(event.target.value)
                          }
                          required
                          className="form-control-medium"
                        />
                      </div>
                      {!isBooleanSchema && (
                        <div className="form-field">
                          <Label htmlFor="condition-return-value" className="form-label">
                            Return value
                          </Label>
                          <Input
                            id="condition-return-value"
                            placeholder="Value to return"
                            value={resultValue}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                              setResultValue(event.target.value)
                            }
                            required
                            className="form-control-medium"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createCondition.isPending}
                      className="bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
                    >
                      {createCondition.isPending ? "Creating..." : "Create condition"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAdding(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={!!confirmationModal} onOpenChange={() => setConfirmationModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                <AlertTriangle className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <DialogTitle className="text-left">
                  {confirmationModal?.type === "enable" ? "Enable" : "Disable"} condition?
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription className="text-left">
            {confirmationModal?.type === "enable"
              ? `This will activate the condition "${confirmationModal?.conditionProperty}" and may affect how users see this feature flag.`
              : `This will deactivate the condition "${confirmationModal?.conditionProperty}" and may change flag behavior for affected users.`}
          </DialogDescription>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmationModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={executeConditionChange}
              className={
                confirmationModal?.type === "enable"
                  ? "bg-[var(--success)] hover:bg-[var(--success)]"
                  : "bg-[var(--danger)] hover:bg-[var(--danger)]"
              }
            >
              {confirmationModal?.type === "enable" ? "Enable condition" : "Disable condition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function parseValue(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
