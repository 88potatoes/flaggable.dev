import { auth0 } from "./auth0";
import { FlagError } from "@/slices/flags/errors";
import { z } from "zod";
import { DrizzleProjectRepository, type ProjectRepository } from "@/slices/projects/repo";

/** A transport-level error that can be rendered as the public API error envelope. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
    readonly code = "api_error",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth0.getSession();

  if (!session?.user.sub) {
    throw new ApiError(401, "Authentication is required.");
  }

  return session.user.sub;
}

export async function requireProjectScope(
  request: Request,
  pathProjectId?: string,
  projects: ProjectRepository = new DrizzleProjectRepository(),
) {
  const ownerId = await requireUserId();
  const headerProjectId = request.headers.get("x-flaggable-project-id")?.trim();
  const url = new URL(request.url);
  const queryProjectId = url.searchParams.get("projectId")?.trim();

  const projectId = pathProjectId || headerProjectId || queryProjectId;

  if (!projectId) {
    throw new ApiError(
      400,
      "Project context required via 'X-Flaggable-Project-Id' header or route parameter.",
    );
  }

  const project = await projects.findById({ projectId });
  if (!project || project.ownerUserId !== ownerId) {
    throw new ApiError(404, "Project not found.");
  }
  if (project.archivedAt) {
    throw new ApiError(409, "Project is archived.");
  }

  return { projectId, ownerId, project };
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const result = schema.safeParse(await readJsonBody(request));

  if (!result.success) {
    throw new ApiError(400, "Request body failed validation.", result.error.issues);
  }

  return result.data;
}

/** Converts expected application errors into the stable public API envelope. */
export function handleApiError(error: unknown): Response {
  const requestId = makeRequestId();
  const apiError = toApiError(error);
  if (apiError.status >= 500) {
    console.error("API request failed", { requestId, error });
  }

  return Response.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details ? { details: apiError.details } : {}),
        requestId,
      },
    },
    { status: apiError.status, headers: { "x-request-id": requestId } },
  );
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof FlagError) {
    const statusByCode = {
      flag_not_found: 404,
      flag_archived: 409,
      project_not_found: 404,
      project_archived: 409,
      flag_name_conflict: 409,
      value_schema_not_found: 422,
      value_schema_project_mismatch: 422,
      invalid_pagination_cursor: 400,
    } satisfies Record<FlagError["code"], number>;
    return new ApiError(statusByCode[error.code], error.message, error.details, error.code, {
      cause: error,
    });
  }
  return new ApiError(500, "Internal server error.", undefined, "internal_error", {
    cause: error,
  });
}

function makeRequestId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function requiredString(body: Record<string, unknown>, field: string): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${field} must be a non-empty string.`);
  }

  return value.trim();
}

export function optionalString(body: Record<string, unknown>, field: string): string | undefined {
  const value = body[field];

  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be a string.`);
  }

  return value.trim();
}

export function optionalBoolean(body: Record<string, unknown>, field: string): boolean | undefined {
  const value = body[field];

  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ApiError(400, `${field} must be a boolean.`);
  }

  return value;
}

export function requiredJsonValue(body: Record<string, unknown>, field: string): unknown {
  if (!(field in body)) {
    throw new ApiError(400, `${field} is required.`);
  }

  return body[field];
}

export function requiredPositiveInteger(body: Record<string, unknown>, field: string): number {
  const value = body[field];

  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new ApiError(400, `${field} must be a positive integer.`);
  }

  return value as number;
}
