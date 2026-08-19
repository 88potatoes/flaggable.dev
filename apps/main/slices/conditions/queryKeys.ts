export const conditionQueryKeys = {
  byFlag: (flagId: string) => ["conditions", flagId] as const,
  byId: (conditionId: string) => ["condition", conditionId] as const,
};
