"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/slices/http";

import type { Flag } from "@flaggable/contracts";
import { flagQueryKeys } from "./queryKeys";

export function useQueryFlags(projectId: string) {
  return useQuery({
    queryKey: flagQueryKeys.byProject(projectId),
    queryFn: () => api.get(`projects/${projectId}/flags`).json<Flag[]>(),
    enabled: Boolean(projectId),
  });
}

export function useQueryFlag(flagId: string) {
  return useQuery({
    queryKey: flagQueryKeys.byId(flagId),
    queryFn: () => api.get(`flags/${flagId}`).json<Flag>(),
    enabled: Boolean(flagId),
  });
}

export function useMutateCreateFlag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      valueSchemaId: string;
      key: string;
      name: string;
      description?: string;
      fallbackValue: unknown;
    }) => api.post(`projects/${projectId}/flags`, { json: values }).json<Flag>(),
    onSuccess: (flag) => {
      queryClient.setQueryData(flagQueryKeys.byId(flag.id), flag);
      queryClient.invalidateQueries({ queryKey: flagQueryKeys.byProject(projectId) });
    },
  });
}

export function useMutateUpdateFlag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      flagId,
      values,
    }: {
      flagId: string;
      values: { name?: string; description?: string; enabled?: boolean; fallbackValue?: unknown };
    }) => api.patch(`flags/${flagId}`, { json: values }).json<Flag>(),
    onSuccess: (flag) => {
      queryClient.setQueryData(flagQueryKeys.byId(flag.id), flag);
      queryClient.invalidateQueries({ queryKey: flagQueryKeys.byProject(projectId) });
    },
  });
}

export function useMutateArchiveFlag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flagId }: { flagId: string }) => api.delete(`flags/${flagId}`).json<Flag>(),
    onSuccess: (flag) => {
      queryClient.setQueryData(flagQueryKeys.byId(flag.id), flag);
      queryClient.invalidateQueries({ queryKey: flagQueryKeys.byProject(projectId) });
    },
  });
}
