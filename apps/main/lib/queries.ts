"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Flag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  fallbackValue: unknown;
  archivedAt: string | null;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  archivedAt: string | null;
};

export type ValueSchema = {
  id: string;
  name: string;
  schemaJson: Record<string, unknown>;
};

type ApiError = { error?: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export const projectKeys = { all: ["projects"] as const };
export const flagKeys = {
  all: ["flags"] as const,
  byProject: (projectId: string) => ["flags", projectId] as const,
};
export const schemaKeys = {
  byProject: (projectId: string) => ["schemas", projectId] as const,
};

export function useProjectsQuery() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => request<Project[]>("/api/projects"),
  });
}

export function useFlagsQuery(projectId: string) {
  return useQuery({
    queryKey: flagKeys.byProject(projectId),
    queryFn: () => request<Flag[]>(`/api/projects/${projectId}/flags`),
    enabled: Boolean(projectId),
  });
}

export function useSchemasQuery(projectId: string) {
  return useQuery({
    queryKey: schemaKeys.byProject(projectId),
    queryFn: () => request<ValueSchema[]>(`/api/projects/${projectId}/schemas`),
    enabled: Boolean(projectId),
  });
}

export function useUpdateFlagMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flagId, enabled }: { flagId: string; enabled: boolean }) =>
      request<Flag>(`/api/flags/${flagId}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flagKeys.byProject(projectId) });
    },
  });
}

export function useCreateFlagMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: {
      valueSchemaId: string;
      key: string;
      name: string;
      fallbackValue: unknown;
    }) =>
      request<Flag>(`/api/projects/${projectId}/flags`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flagKeys.byProject(projectId) });
    },
  });
}
