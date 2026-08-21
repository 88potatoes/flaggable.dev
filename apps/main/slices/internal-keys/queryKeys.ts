export const internalKeyQueryKeys = {
  byProject: (projectId: string) => ["internal-keys", projectId] as const,
};
