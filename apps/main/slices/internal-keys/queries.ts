"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/slices/http";
import { internalKeyQueryKeys } from "./queryKeys";

export type InternalKey = {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  revokedAt: string | null;
  internalKey?: string;
};

export type CreatedInternalKey = InternalKey & { internalKey: string };

export function useQueryInternalKeys(projectId: string) {
  return useQuery({
    queryKey: internalKeyQueryKeys.byProject(projectId),
    queryFn: () => api.get(`projects/${projectId}/internal-keys`).json<InternalKey[]>(),
    enabled: Boolean(projectId),
  });
}

export function useMutateCreateInternalKey(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name?: string } = {}) =>
      api
        .post(`projects/${projectId}/internal-keys`, { json: { name } })
        .json<CreatedInternalKey>(),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: internalKeyQueryKeys.byProject(projectId) });
      return created;
    },
  });
}
