export const flagQueryKeys = {
  all: ["flags"] as const,
  byProject: (projectId: string) => ["flags", projectId] as const,
  byId: (flagId: string) => ["flag", flagId] as const,
};
