export const flagQueryKeys = {
  all: ["flags"] as const,
  byProject: (projectId: string, search = "") => ["flags", projectId, { search }] as const,
  byId: (flagId: string) => ["flag", flagId] as const,
};
