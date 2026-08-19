"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ConditionOperator, Flag } from "@flaggable/contracts";

import { Button } from "@flaggable/ui/button";
import { Card } from "@flaggable/ui/card";
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

export function ConditionList({ flag }: { flag: Flag }) {
  const [property, setProperty] = useState("");
  const [operator, setOperator] = useState<ConditionOperator>("equals");
  const [predicateValue, setPredicateValue] = useState("");
  const [resultValue, setResultValue] = useState(JSON.stringify(flag.fallbackValue));
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
        resultValue: parseValue(resultValue),
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
    <Card className="condition-panel">
      <div className="panel-heading p-0">
        <div>
          <h2>Conditions</h2>
          <p>Target this flag to specific audiences.</p>
        </div>
      </div>
      <div className="condition-list">
        {conditions.length === 0 && (
          <p className="text-sm text-muted-foreground">No conditions yet.</p>
        )}
        {conditions.map((condition) => (
          <div className="condition-row" key={condition.id}>
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
      </div>
      <form className="condition-form" onSubmit={submit}>
        <Label htmlFor="condition-property">New condition</Label>
        <div className="condition-form-grid">
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
          <Input
            placeholder="Result value"
            value={resultValue}
            onChange={(event) => setResultValue(event.target.value)}
            required
          />
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
