"use client";

import { useMemo, useState } from "react";
import { Plus, Settings, Lock, Unlock, AlertTriangle, Sparkles } from "lucide-react";
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
    createCondition.mutate(
      {
        position: nextPosition,
        property: property.trim(),
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
      <Card className="gap-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Targeting Conditions</CardTitle>
          </div>
          <CardDescription>
            Control when this flag is enabled for different users and contexts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          {conditions.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Settings className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">No conditions configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                This flag will evaluate to its default value ({flag.enabled ? "Active" : "Inactive"}
                ).
              </p>
              {onOpenAgentPrompt && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenAgentPrompt}
                    className="gap-1.5 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                  >
                    <Sparkles className="size-3.5 text-orange-600" />
                    Set up in Next.js with AI
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={condition.id}
                  className={`rounded-lg border p-4 transition-all ${
                    condition.enabled
                      ? "border-green-200 bg-green-50/50"
                      : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-200 text-xs font-bold">
                            {index + 1}
                          </span>
                          CONDITION
                        </span>
                        {condition.enabled ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                            <Unlock className="h-3 w-3" />
                            Active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                            <Lock className="h-3 w-3" />
                            Disabled
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-600">When </span>
                          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-900">
                            {condition.property}
                          </code>
                          <span className="text-gray-600"> {condition.operator} </span>
                          <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-900">
                            {JSON.stringify(condition.predicateValue)}
                          </code>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Return </span>
                          <code className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-900">
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
                        className={condition.enabled ? "" : "bg-green-600 hover:bg-green-700"}
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
        <div className="border-t px-6 pb-6 pt-4">
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
                <form className="space-y-4" onSubmit={submit}>
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="condition-property" className="text-sm font-semibold">
                      New targeting condition
                    </Label>
                  </div>

                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Property</Label>
                        <Input
                          id="condition-property"
                          placeholder="e.g. country, userId"
                          value={property}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setProperty(event.target.value)
                          }
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Operator</Label>
                        <Select
                          value={operator}
                          onValueChange={(value: string) => setOperator(value as ConditionOperator)}
                        >
                          <SelectTrigger aria-label="Operator" className="mt-1">
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

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Match value</Label>
                        <Input
                          placeholder="Value to match"
                          value={predicateValue}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setPredicateValue(event.target.value)
                          }
                          required
                          className="mt-1"
                        />
                      </div>
                      {!isBooleanSchema && (
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Return value</Label>
                          <Input
                            placeholder="Value to return"
                            value={resultValue}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                              setResultValue(event.target.value)
                            }
                            required
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createCondition.isPending}
                      className="flex-1"
                    >
                      {createCondition.isPending ? "Creating..." : "Create condition"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAdding(false)}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
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
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
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
