"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/slices/http";

import type { ValueSchema } from "@flaggable/contracts";
import { schemaQueryKeys } from "./queryKeys";

export function useQuerySchemas(projectId: string) {
  return useQuery({
    queryKey: schemaQueryKeys.byProject(projectId),
    queryFn: () => api.get(`projects/${projectId}/schemas`).json<ValueSchema[]>(),
    enabled: Boolean(projectId),
  });
}

export function useQuerySchema(schemaId: string) {
  return useQuery({
    queryKey: schemaQueryKeys.byId(schemaId),
    queryFn: () => api.get(`schemas/${schemaId}`).json<ValueSchema>(),
    enabled: Boolean(schemaId),
  });
}

export function useMutateCreateSchema(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, schemaJson }: { name: string; schemaJson: Record<string, unknown> }) =>
      api.post(`projects/${projectId}/schemas`, { json: { name, schemaJson } }).json<ValueSchema>(),
    onSuccess: (schema) => {
      queryClient.setQueryData(schemaQueryKeys.byId(schema.id), schema);
      queryClient.invalidateQueries({ queryKey: schemaQueryKeys.byProject(projectId) });
    },
  });
}

export function useMutateUpdateSchema(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      schemaId,
      values,
    }: {
      schemaId: string;
      values: { name?: string; schemaJson?: Record<string, unknown> };
    }) => api.patch(`schemas/${schemaId}`, { json: values }).json<ValueSchema>(),
    onSuccess: (schema) => {
      queryClient.setQueryData(schemaQueryKeys.byId(schema.id), schema);
      queryClient.invalidateQueries({ queryKey: schemaQueryKeys.byProject(projectId) });
    },
  });
}
