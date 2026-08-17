import { auth0 } from "./auth0";
import { z } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
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

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const result = schema.safeParse(await readJsonBody(request));

  if (!result.success) {
    throw new ApiError(400, "Request body failed validation.", result.error.issues);
  }

  return result.data;
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, ...(error.details ? { details: error.details } : {}) },
      { status: error.status },
    );
  }

  console.error("API request failed", error);
  return Response.json({ error: "Internal server error." }, { status: 500 });
}

export function requiredString(
  body: Record<string, unknown>,
  field: string,
): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${field} must be a non-empty string.`);
  }

  return value.trim();
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = body[field];

  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be a string.`);
  }

  return value.trim();
}

export function optionalBoolean(
  body: Record<string, unknown>,
  field: string,
): boolean | undefined {
  const value = body[field];

  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ApiError(400, `${field} must be a boolean.`);
  }

  return value;
}

export function requiredJsonValue(
  body: Record<string, unknown>,
  field: string,
): unknown {
  if (!(field in body)) {
    throw new ApiError(400, `${field} is required.`);
  }

  return body[field];
}

export function requiredPositiveInteger(
  body: Record<string, unknown>,
  field: string,
): number {
  const value = body[field];

  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new ApiError(400, `${field} must be a positive integer.`);
  }

  return value as number;
}
