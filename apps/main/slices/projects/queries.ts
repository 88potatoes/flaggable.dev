"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/slices/http";

import type { Project } from "@flaggable/contracts";
import { projectQueryKeys } from "./queryKeys";

export function useQueryProjects() {
  return useQuery({
    queryKey: projectQueryKeys.all,
    queryFn: () => api.get("projects").json<Project[]>(),
  });
}

export function useQueryProject(projectId: string) {
  return useQuery({
    queryKey: projectQueryKeys.byId(projectId),
    queryFn: () => api.get(`projects/${projectId}`).json<Project>(),
    enabled: Boolean(projectId),
  });
}

export function useMutateCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name }: { name: string }) =>
      api.post("projects", { json: { name } }).json<Project>(),
    onSuccess: (project) => {
      queryClient.setQueryData(projectQueryKeys.byId(project.id), project);
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}

export function useMutateUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) =>
      api.patch(`projects/${projectId}`, { json: { name } }).json<Project>(),
    onSuccess: (project) => {
      queryClient.setQueryData(projectQueryKeys.byId(project.id), project);
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}

export function useMutateArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) =>
      api.delete(`projects/${projectId}`).json<Project>(),
    onSuccess: (project) => {
      queryClient.setQueryData(projectQueryKeys.byId(project.id), project);
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}
