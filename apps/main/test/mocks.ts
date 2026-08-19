import { vi } from "vitest";

import type {
  ConditionRecord,
  FlagRecord,
  ProjectRecord,
  ValueSchemaRecord,
} from "@/lib/db/schema";
import type { ConditionRepository } from "@/slices/conditions/repo";
import { ConditionService } from "@/slices/conditions/service";
import type { FlagRepository } from "@/slices/flags/repo";
import { FlagService } from "@/slices/flags/service";
import type { ProjectRepository } from "@/slices/projects/repo";
import { ProjectService } from "@/slices/projects/service";
import type { ValueSchemaRepository } from "@/slices/value-schemas/repo";
import { ValueSchemaService } from "@/slices/value-schemas/service";

export const mockProject: ProjectRecord = {
  id: "project-1",
  ownerUserId: "owner-1",
  name: "Platform",
  archivedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

export const mockSchema: ValueSchemaRecord = {
  id: "schema-1",
  projectId: mockProject.id,
  name: "Text",
  schemaJson: JSON.stringify({ type: "string" }),
  createdAt: new Date("2026-01-01"),
};

export const mockFlag: FlagRecord = {
  id: "flag-1",
  projectId: mockProject.id,
  valueSchemaId: mockSchema.id,
  name: "Flag",
  description: null,
  enabled: true,
  fallbackValue: JSON.stringify("off"),
  archivedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

export const mockCondition: ConditionRecord = {
  id: "condition-1",
  flagId: mockFlag.id,
  position: 1,
  enabled: true,
  property: "country",
  operator: "equals",
  predicateValue: JSON.stringify("US"),
  resultValue: JSON.stringify("on"),
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

export function mockProjectRepo(overrides: Partial<ProjectRepository> = {}): ProjectRepository {
  return {
    listByOwner: vi.fn(async () => [mockProject]),
    findById: vi.fn(async () => mockProject),
    create: vi.fn(async ({ record }) => record as ProjectRecord),
    update: vi.fn(async ({ projectId, values }) => ({
      ...mockProject,
      id: projectId,
      ...values,
    })),
    ...overrides,
  };
}

export function mockSchemaRepo(
  overrides: Partial<ValueSchemaRepository> = {},
): ValueSchemaRepository {
  const records = [mockSchema];
  return {
    listByProject: vi.fn(async ({ projectId }) =>
      records.filter((item) => item.projectId === projectId),
    ),
    findById: vi.fn(async ({ schemaId }) => records.find((item) => item.id === schemaId)),
    create: vi.fn(async ({ record }) => {
      records.push(record as ValueSchemaRecord);
      return record as ValueSchemaRecord;
    }),
    update: vi.fn(async ({ schemaId, values }) => ({
      ...records.find((item) => item.id === schemaId)!,
      ...values,
    })),
    ...overrides,
  };
}

export function mockFlagRepo(overrides: Partial<FlagRepository> = {}): FlagRepository {
  const records = [mockFlag];
  return {
    listByProject: vi.fn(async ({ projectId, limit = 25 }) => ({
      items: records.filter((item) => item.projectId === projectId).slice(0, limit),
      hasMore: false,
    })),
    findById: vi.fn(async ({ flagId }) => records.find((item) => item.id === flagId)),
    create: vi.fn(async ({ record }) => {
      records.push(record as FlagRecord);
      return record as FlagRecord;
    }),
    update: vi.fn(async ({ flagId, values }) => ({
      ...records.find((item) => item.id === flagId)!,
      ...values,
    })),
    ...overrides,
  };
}

export function mockConditionRepo(
  overrides: Partial<ConditionRepository> = {},
): ConditionRepository {
  const records = [mockCondition];
  return {
    listByFlag: vi.fn(async ({ flagId }) => records.filter((item) => item.flagId === flagId)),
    findById: vi.fn(async ({ conditionId }) => records.find((item) => item.id === conditionId)),
    create: vi.fn(async ({ record }) => {
      records.push(record as ConditionRecord);
      return record as ConditionRecord;
    }),
    update: vi.fn(async ({ conditionId, values }) => ({
      ...records.find((item) => item.id === conditionId)!,
      ...values,
    })),
    ...overrides,
  };
}

/** Creates a project service backed by a mock repository. */
export const mockProjectService = (repository = mockProjectRepo(), schemas = mockSchemaRepo()) =>
  new ProjectService(repository, schemas);

/** Creates a value-schema service backed by mock repositories. */
export const mockSchemaService = ({
  repository = mockSchemaRepo(),
  projects = mockProjectRepo(),
}: {
  repository?: ValueSchemaRepository;
  projects?: ProjectRepository;
} = {}) => new ValueSchemaService(repository, projects);

/** Creates a flag service backed by mock repositories. */
export const mockFlagService = ({
  repository = mockFlagRepo(),
  projects = mockProjectRepo(),
  schemas = mockSchemaRepo(),
}: {
  repository?: FlagRepository;
  projects?: ProjectRepository;
  schemas?: ValueSchemaRepository;
} = {}) => new FlagService(repository, projects, schemas);

/** Creates a condition service backed by mock repositories. */
export const mockConditionService = ({
  repository = mockConditionRepo(),
  flags = mockFlagRepo(),
  schemas = mockSchemaRepo(),
  projects = mockProjectRepo(),
}: {
  repository?: ConditionRepository;
  flags?: FlagRepository;
  schemas?: ValueSchemaRepository;
  projects?: ProjectRepository;
} = {}) => new ConditionService(repository, flags, schemas, projects);
