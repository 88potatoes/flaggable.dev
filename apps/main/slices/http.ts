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

  const body = await error.response
    .json<{
      error?:
        | string
        | {
            code?: string;
            message?: string;
            details?: unknown;
            requestId?: string;
          };
    }>()
    .catch(
      (): {
        error?:
          | string
          | {
              code?: string;
              message?: string;
              details?: unknown;
              requestId?: string;
            };
      } => ({}),
    );
  const payload = body.error;
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
