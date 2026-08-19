"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Flag, FlagPage } from "@flaggable/contracts";

import { api } from "@/slices/http";
import { flagQueryKeys } from "./queryKeys";

export function useQueryFlags(projectId: string, search = "") {
  return useInfiniteQuery({
    queryKey: flagQueryKeys.byProject(projectId, search),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "25" });
      if (search) params.set("search", search);
      if (pageParam) params.set("cursor", pageParam);
      return api.get(`projects/${projectId}/flags?${params}`).json<FlagPage>();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
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

function invalidateProjectFlags(queryClient: ReturnType<typeof useQueryClient>, projectId: string) {
  return queryClient.invalidateQueries({ queryKey: ["flags", projectId] });
}

export function useMutateCreateFlag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { valueSchemaId: string; name: string; description?: string }) =>
      api.post(`projects/${projectId}/flags`, { json: values }).json<Flag>(),
    onSuccess: async (flag) => {
      queryClient.setQueryData(flagQueryKeys.byId(flag.id), flag);
      await invalidateProjectFlags(queryClient, projectId);
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
      values: { name?: string; description?: string; enabled?: boolean };
    }) => api.patch(`flags/${flagId}`, { json: values }).json<Flag>(),
    onSuccess: async (flag) => {
      queryClient.setQueryData(flagQueryKeys.byId(flag.id), flag);
      await invalidateProjectFlags(queryClient, projectId);
    },
  });
}

export function useMutateArchiveFlag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flagId }: { flagId: string }) => api.delete(`flags/${flagId}`).json<Flag>(),
    onSuccess: async (flag) => {
      queryClient.setQueryData(flagQueryKeys.byId(flag.id), flag);
      await invalidateProjectFlags(queryClient, projectId);
    },
  });
}
