export const publicKeyQueryKeys = {
  byProject: (projectId: string) => ["public-keys", projectId] as const,
};
