import ky, { HTTPError } from "ky";

/** A structured error returned by the dashboard API. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = "api_error",
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Returns a useful message for UI notifications without coupling components to ky. */
export function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError || error instanceof Error
    ? error.message || fallback
    : fallback;
}

async function parseApiError({ error }: { error: Error }): Promise<Error> {
  if (!(error instanceof HTTPError)) return error;

  // ky parses the response before running beforeError and consumes the body.
  // Read error.data rather than calling response.json(), which would be empty.
  const body = isApiErrorBody(error.data) ? error.data : undefined;
  const payload = body?.error;
  if (typeof payload === "string") {
    return new ApiClientError(payload, error.response.status);
  }

  return new ApiClientError(
    payload?.message ?? error.message,
    error.response.status,
    payload?.code,
    payload?.details,
    payload?.requestId ?? error.response.headers.get("x-request-id") ?? undefined,
  );
}

function isApiErrorBody(value: unknown): value is {
  error?:
    | string
    | {
        code?: string;
        message?: string;
        details?: unknown;
        requestId?: string;
      };
} {
  return typeof value === "object" && value !== null && "error" in value;
}

let activeProjectId: string | null = null;

export function setActiveProjectId(projectId: string | null) {
  activeProjectId = projectId;
}

export function getActiveProjectId(): string | null {
  return activeProjectId;
}

export const api = ky.create({
  prefix: "/api/v1",
  headers: {
    "content-type": "application/json",
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        if (activeProjectId && !request.headers.has("x-flaggable-project-id")) {
          request.headers.set("x-flaggable-project-id", activeProjectId);
        }
      },
    ],
    beforeError: [parseApiError],
  },
});

export function apiWithProject(projectId: string) {
  return api.extend({
    headers: {
      "x-flaggable-project-id": projectId,
    },
  });
}
