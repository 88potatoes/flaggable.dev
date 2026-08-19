export const projectQueryKeys = {
  all: ["projects"] as const,
  byId: (projectId: string) => ["projects", projectId] as const,
};
