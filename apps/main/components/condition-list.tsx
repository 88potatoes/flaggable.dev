"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ConditionOperator, Flag } from "@flaggable/contracts";

import { Button } from "@flaggable/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flaggable/ui/card";
import { Input } from "@flaggable/ui/input";
import { Label } from "@flaggable/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flaggable/ui/select";
import { Switch } from "@flaggable/ui/switch";
import {
  useMutateCreateCondition,
  useMutateUpdateCondition,
  useQueryConditions,
} from "@/slices/conditions/queries";
import { useQuerySchema } from "@/slices/value-schemas/queries";

export function ConditionList({ flag }: { flag: Flag }) {
  const [property, setProperty] = useState("");
  const [operator, setOperator] = useState<ConditionOperator>("equals");
  const [predicateValue, setPredicateValue] = useState("");
  const [resultValue, setResultValue] = useState("");
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
        },
      },
    );
  }

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Conditions</CardTitle>
        <CardDescription>Target this flag to specific audiences.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 pb-0">
        {conditions.length === 0 && (
          <p className="text-sm text-muted-foreground">No conditions yet.</p>
        )}
        {conditions.map((condition) => (
          <div
            className="flex items-center justify-between gap-4 border-b py-3 text-sm last:border-b-0"
            key={condition.id}
          >
            <span>
              <strong>{condition.property}</strong> {condition.operator}{" "}
              {JSON.stringify(condition.predicateValue)} → {JSON.stringify(condition.resultValue)}
            </span>
            <Switch
              checked={condition.enabled}
              onCheckedChange={(enabled) =>
                updateCondition.mutate({ conditionId: condition.id, values: { enabled } })
              }
              aria-label={`Toggle condition ${condition.property}`}
            />
          </div>
        ))}
      </CardContent>
      <form className="grid gap-3 px-6 pb-6" onSubmit={submit}>
        <Label htmlFor="condition-property">New condition</Label>
        <div className="grid gap-2 md:grid-cols-[1.2fr_0.9fr_1fr_1fr]">
          <Input
            id="condition-property"
            placeholder="Property (e.g. country)"
            value={property}
            onChange={(event) => setProperty(event.target.value)}
            required
          />
          <Select
            value={operator}
            onValueChange={(value) => setOperator(value as ConditionOperator)}
          >
            <SelectTrigger aria-label="Operator">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["equals", "not_equals", "in", "not_in"].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Match value"
            value={predicateValue}
            onChange={(event) => setPredicateValue(event.target.value)}
            required
          />
          {!isBooleanSchema && (
            <Input
              placeholder="Result value"
              value={resultValue}
              onChange={(event) => setResultValue(event.target.value)}
              required
            />
          )}
        </div>
        <Button type="submit" disabled={createCondition.isPending}>
          <Plus /> Add condition
        </Button>
      </form>
    </Card>
  );
}

function parseValue(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
