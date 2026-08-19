export const schemaQueryKeys = {
  byProject: (projectId: string) => ["schemas", projectId] as const,
  byId: (schemaId: string) => ["schema", schemaId] as const,
};
