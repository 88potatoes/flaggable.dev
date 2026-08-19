"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/slices/http";

import type { Condition, ConditionOperator } from "@flaggable/contracts";
import { conditionQueryKeys } from "./queryKeys";

export function useQueryConditions(flagId: string) {
  return useQuery({
    queryKey: conditionQueryKeys.byFlag(flagId),
    queryFn: () => api.get(`flags/${flagId}/conditions`).json<Condition[]>(),
    enabled: Boolean(flagId),
  });
}

export function useQueryCondition(conditionId: string) {
  return useQuery({
    queryKey: conditionQueryKeys.byId(conditionId),
    queryFn: () => api.get(`conditions/${conditionId}`).json<Condition>(),
    enabled: Boolean(conditionId),
  });
}

export function useMutateCreateCondition(flagId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      position: number;
      enabled?: boolean;
      property: string;
      operator: ConditionOperator;
      predicateValue: unknown;
      resultValue: unknown;
    }) => api.post(`flags/${flagId}/conditions`, { json: values }).json<Condition>(),
    onSuccess: (condition) => {
      queryClient.setQueryData(conditionQueryKeys.byId(condition.id), condition);
      queryClient.invalidateQueries({ queryKey: conditionQueryKeys.byFlag(flagId) });
    },
  });
}

export function useMutateUpdateCondition(flagId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conditionId,
      values,
    }: {
      conditionId: string;
      values: {
        position?: number;
        enabled?: boolean;
        property?: string;
        operator?: ConditionOperator;
        predicateValue?: unknown;
        resultValue?: unknown;
      };
    }) => api.patch(`conditions/${conditionId}`, { json: values }).json<Condition>(),
    onSuccess: (condition) => {
      queryClient.setQueryData(conditionQueryKeys.byId(condition.id), condition);
      queryClient.invalidateQueries({ queryKey: conditionQueryKeys.byFlag(flagId) });
    },
  });
}
