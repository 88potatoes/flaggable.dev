"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/slices/http";
import { publicKeyQueryKeys } from "./queryKeys";

export type PublicKey = {
  id: string;
  projectId: string;
  createdAt: string;
  revokedAt: string | null;
};

export type CreatedPublicKey = PublicKey & { publicKey: string };

export function useQueryPublicKeys(projectId: string) {
  return useQuery({
    queryKey: publicKeyQueryKeys.byProject(projectId),
    queryFn: () => api.get(`projects/${projectId}/public-keys`).json<PublicKey[]>(),
    enabled: Boolean(projectId),
  });
}

export function useMutateCreatePublicKey(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`projects/${projectId}/public-keys`).json<CreatedPublicKey>(),
    onSuccess: (created) => {
      // Never cache the raw token: it is intentionally available only to the create UI.
      queryClient.invalidateQueries({ queryKey: publicKeyQueryKeys.byProject(projectId) });
      return created;
    },
  });
}
