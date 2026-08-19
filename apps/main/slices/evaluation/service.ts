import { ApiError } from "@/lib/api";
import { evaluateConditions } from "@/lib/flags/evaluate";
import type { JsonObject, JsonValue } from "@/lib/flags/types";
import { DrizzleConditionRepository, type ConditionRepository } from "@/slices/conditions/repo";
import { DrizzleFlagRepository, type FlagRepository } from "@/slices/flags/repo";
import { DrizzleProjectRepository, type ProjectRepository } from "@/slices/projects/repo";
import { PublicKeyService } from "@/slices/public-keys/service";

export type FlagEvaluation = {
  flagId: string;
  name: string;
  value: JsonValue | null;
  matchedConditionId: string | null;
};

export type EvaluationResponse = {
  projectId: string;
  evaluations: FlagEvaluation[];
};

export class EvaluationService {
  private readonly keys: PublicKeyService;

  constructor(
    private readonly flags: FlagRepository = new DrizzleFlagRepository(),
    private readonly conditions: ConditionRepository = new DrizzleConditionRepository(),
    private readonly projects: ProjectRepository = new DrizzleProjectRepository(),
    keys?: PublicKeyService,
  ) {
    this.keys = keys ?? new PublicKeyService(undefined, projects);
  }

  evaluate = async ({
    publicKey,
    context,
  }: {
    publicKey: string;
    context: JsonObject;
  }): Promise<EvaluationResponse> => {
    const key = await this.keys.resolve({ publicKey });
    if (!key) throw new ApiError(401, "Invalid or revoked public key.");
    const project = await this.projects.findById({ projectId: key.projectId });
    if (!project || project.archivedAt) throw new ApiError(401, "Invalid or revoked public key.");

    const { items } = await this.flags.listByProject({ projectId: project.id, limit: 100 });
    const evaluations: FlagEvaluation[] = [];
    for (const flag of items) {
      if (!flag.enabled || flag.archivedAt) continue;
      const conditions = await this.conditions.listByFlag({ flagId: flag.id });
      const result = evaluateConditions({
        properties: context,
        fallbackValue: null,
        conditions: conditions.map((condition) => ({
          id: condition.id,
          position: condition.position,
          enabled: condition.enabled,
          predicate: {
            property: condition.property,
            operator: condition.operator as "equals" | "not_equals" | "in" | "not_in",
            value: JSON.parse(condition.predicateValue) as JsonValue,
          },
          resultValue: JSON.parse(condition.resultValue) as JsonValue,
        })),
      });
      evaluations.push({ flagId: flag.id, name: flag.name, ...result });
    }
    return { projectId: project.id, evaluations };
  };
}
